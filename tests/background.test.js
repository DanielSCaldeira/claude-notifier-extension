import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createClaudeUsageFetchMock } from "./mocks/claude-usage.js";

const backgroundSource = fs.readFileSync(
  path.resolve(process.cwd(), "src/background/background.js"),
  "utf8"
);
const sharedI18nSource = fs.readFileSync(
  path.resolve(process.cwd(), "src/shared/shared-i18n.js"),
  "utf8"
);
const sharedNotificationsSource = fs.readFileSync(
  path.resolve(process.cwd(), "src/shared/shared-notifications.js"),
  "utf8"
);
const TEST_ORG_ID = "org-test-123";

function createChromeMock(storageState = {}, uiLanguage = "pt-BR") {
  const state = { ...storageState };
  const createdAlarms = [];
  const clearedAlarms = [];
  const createdTabs = [];
  const createdNotifications = [];
  let runtimeLastError = null;

  return {
    state,
    createdAlarms,
    clearedAlarms,
    createdTabs,
    createdNotifications,
    setRuntimeLastError: (value) => {
      runtimeLastError = value;
    },
    chrome: {
      alarms: {
        create: vi.fn((name, info) => {
          createdAlarms.push({ name, info });
        }),
        clear: vi.fn((name) => {
          clearedAlarms.push(name);
        }),
        onAlarm: {
          addListener: vi.fn()
        }
      },
      notifications: {
        create: vi.fn((options, callback) => {
          createdNotifications.push(options);
          callback?.("notification-id");
        })
      },
      runtime: {
        getURL: vi.fn((value) => value),
        get lastError() {
          return runtimeLastError;
        },
        onMessage: {
          addListener: vi.fn()
        }
      },
      i18n: {
        getMessage: vi.fn(() => ""),
        getUILanguage: vi.fn(() => uiLanguage)
      },
      storage: {
        local: {
          get: vi.fn((keys, callback) => {
            const requestedKeys = Array.isArray(keys) ? keys : [keys];
            const result = {};

            requestedKeys.forEach((key) => {
              if (key in state) {
                result[key] = state[key];
              }
            });

            callback(result);
          }),
          set: vi.fn((value, callback) => {
            Object.assign(state, value);
            callback?.();
          }),
          remove: vi.fn((keys, callback) => {
            const requestedKeys = Array.isArray(keys) ? keys : [keys];
            requestedKeys.forEach((key) => {
              delete state[key];
            });
            callback?.();
          })
        }
      },
      tabs: {
        create: vi.fn((info) => {
          createdTabs.push(info);
        })
      }
    }
  };
}

function loadBackground({ chromeMock, fetchMock }) {
  const context = {
    chrome: chromeMock.chrome,
    fetch: fetchMock,
    console,
    Date,
    Promise,
    setTimeout,
    clearTimeout,
    __CLAUDE_NOTIFIER_TEST__: true
  };

  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(sharedI18nSource, context);
  vm.runInContext(sharedNotificationsSource, context);
  vm.runInContext(backgroundSource, context);

  return context.__claudeNotifierBackground;
}

describe("background.js", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("formata o tempo restante em horas e minutos", () => {
    const chromeMock = createChromeMock();
    const api = loadBackground({
      chromeMock,
      fetchMock: vi.fn()
    });

    expect(api.formatRemaining(90 * 60 * 1000)).toBe("1h 30min");
    expect(api.formatRemaining(60 * 60 * 1000)).toBe("1h");
    expect(api.formatRemaining(5 * 60 * 1000)).toBe("5min");
  });

  it("usa um icone PNG embutido nas notificacoes locais", async () => {
    const chromeMock = createChromeMock();
    const api = loadBackground({
      chromeMock,
      fetchMock: vi.fn()
    });

    await api.notifyStatusResult({
      state: "available",
      message: "Claude liberado"
    });

    expect(chromeMock.createdNotifications).toEqual([
      expect.objectContaining({
        iconUrl: api.NOTIFICATION_ICON_PATH,
        title: "Claude liberado",
        message: "Claude liberado"
      })
    ]);
  });

  it("nao bloqueia o envio ao ntfy quando a notificacao local falha", async () => {
    const chromeMock = createChromeMock();
    chromeMock.state.topic = "claude-topic";
    chromeMock.chrome.notifications.create.mockImplementation((options, callback) => {
      chromeMock.createdNotifications.push(options);
      chromeMock.setRuntimeLastError({ message: "Unable to download all specified images." });
      callback?.();
      chromeMock.setRuntimeLastError(null);
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200
    });

    const api = loadBackground({
      chromeMock,
      fetchMock
    });

    await expect(api.notifyStatusResult({
      state: "available",
      message: "Claude liberado"
    })).resolves.toEqual({
      ok: false,
      error: "Unable to download all specified images.",
      remoteSent: true
    });
    expect(fetchMock).toHaveBeenCalledWith("https://ntfy.sh/claude-topic", expect.any(Object));
  });

  it("agenda o alarme de desbloqueio quando o Claude esta bloqueado", async () => {
    const resetAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
    const chromeMock = createChromeMock({ orgId: TEST_ORG_ID });
    const api = loadBackground({
      chromeMock,
      fetchMock: vi.fn().mockResolvedValue(
        createClaudeUsageFetchMock({
          utilization: 100,
          resetsAt: resetAt
        })[0]
      )
    });

    const result = await api.evaluateClaudeState();

    expect(result.state).toBe("blocked");
    expect(chromeMock.state.resetAt).toBe(resetAt);
    expect(chromeMock.clearedAlarms).toContain(api.POLL_ALARM);
    expect(chromeMock.createdAlarms).toEqual([
      expect.objectContaining({
        name: api.UNLOCK_ALARM,
        info: expect.objectContaining({
          when: expect.any(Number)
        })
      })
    ]);
  });

  it("restaura polling e envia notificacao ao desbloquear depois de um reset salvo", async () => {
    const chromeMock = createChromeMock({
      resetAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      topic: "claude-topic",
      orgId: TEST_ORG_ID
    });
    const [blockedReleasedResponse] = createClaudeUsageFetchMock({
      utilization: 42,
      resetsAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(blockedReleasedResponse)
      .mockResolvedValueOnce({
        ok: true,
        status: 200
      });

    const api = loadBackground({ chromeMock, fetchMock });
    const result = await api.evaluateClaudeState({ notifyOnUnlock: true });

    expect(result.state).toBe("available");
    expect(chromeMock.state.resetAt).toBeUndefined();
    expect(chromeMock.clearedAlarms).toContain(api.UNLOCK_ALARM);
    expect(chromeMock.createdAlarms).toEqual([
      expect.objectContaining({
        name: api.POLL_ALARM,
        info: { periodInMinutes: api.POLL_INTERVAL_MINUTES }
      })
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe("https://ntfy.sh/claude-topic");
    expect(chromeMock.createdNotifications).toEqual([
      expect.objectContaining({
        title: "Claude liberado",
        message: "Claude liberado agora. Uso atual: 42% do limite de 5 horas."
      })
    ]);
  });

  it("abre a aba do Claude apenas uma vez em falhas de autenticacao repetidas", async () => {
    const chromeMock = createChromeMock({ orgId: TEST_ORG_ID });
    const api = loadBackground({
      chromeMock,
      fetchMock: vi.fn().mockResolvedValue({
        ok: false,
        status: 401
      })
    });

    await api.fetchUsage();
    await api.fetchUsage();

    expect(chromeMock.createdTabs).toEqual([{ url: "https://claude.ai" }]);
  });

  it("retorna erro controlado quando o Org ID nao foi configurado", async () => {
    const chromeMock = createChromeMock({ orgId: "" });
    const fetchMock = vi.fn();
    const api = loadBackground({
      chromeMock,
      fetchMock
    });

    await expect(api.getClaudeStatus()).resolves.toEqual({
      ok: false,
      state: "missing-org-id",
      message: "Digite o Org ID do Claude antes de consultar o status."
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("gera mensagens em ingles quando o usuario escolhe ingles", async () => {
    const chromeMock = createChromeMock({ language: "en", orgId: TEST_ORG_ID }, "pt-BR");
    chromeMock.state.topic = "claude-topic";
    const [releasedResponse] = createClaudeUsageFetchMock({
      utilization: 42,
      resetsAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(releasedResponse)
      .mockResolvedValueOnce({
        ok: true,
        status: 200
      });

    const api = loadBackground({ chromeMock, fetchMock });
    const result = await api.evaluateClaudeState({ notifyOnUnlock: true });

    expect(result.message).toBe("Claude is available now. Current usage: 42% of the 5-hour limit.");
    await api.notifyStatusResult(result);
    expect(chromeMock.createdNotifications.at(-1)).toEqual(expect.objectContaining({
      title: "Claude available"
    }));
  });

  it("gera mensagens em espanhol quando o usuario escolhe espanhol", async () => {
    const resetAt = new Date(Date.now() + 45 * 60 * 1000).toISOString();
    const chromeMock = createChromeMock({ language: "es", orgId: TEST_ORG_ID }, "en");
    const [blockedResponse] = createClaudeUsageFetchMock({
      utilization: 100,
      resetsAt: resetAt
    });
    const api = loadBackground({
      chromeMock,
      fetchMock: vi.fn().mockResolvedValue(blockedResponse)
    });

    const result = await api.evaluateClaudeState();

    expect(result.message).toContain("Claude está bloqueado");
  });

  it("simula a API real com bloqueio seguido de liberacao usando mock reutilizavel", async () => {
    const futureResetAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    const pastResetAt = new Date(Date.now() - 1 * 60 * 1000).toISOString();
    const chromeMock = createChromeMock({
      topic: "claude-topic",
      orgId: TEST_ORG_ID
    });
    const [blockedResponse, releasedResponse] = createClaudeUsageFetchMock(
      {
        utilization: 100,
        resetsAt: futureResetAt
      },
      {
        utilization: 12,
        resetsAt: pastResetAt
      }
    );
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(blockedResponse)
      .mockResolvedValueOnce(releasedResponse)
      .mockResolvedValueOnce({
        ok: true,
        status: 200
      });

    const api = loadBackground({ chromeMock, fetchMock });
    const blockedResult = await api.evaluateClaudeState();
    const availableResult = await api.evaluateClaudeState({ notifyOnUnlock: true });

    expect(blockedResult.state).toBe("blocked");
    expect(availableResult.state).toBe("available");
    expect(chromeMock.state.resetAt).toBeUndefined();
    expect(chromeMock.createdNotifications).toEqual([
      expect.objectContaining({
        title: "Claude liberado",
        message: "Claude liberado agora. Uso atual: 12% do limite de 5 horas."
      })
    ]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `https://claude.ai/api/organizations/${TEST_ORG_ID}/usage`,
      { credentials: "include" }
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `https://claude.ai/api/organizations/${TEST_ORG_ID}/usage`,
      { credentials: "include" }
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://ntfy.sh/claude-topic",
      expect.objectContaining({
        method: "POST"
      })
    );
  });

  it("initializeScheduling notifica quando storedResetAt expirou e Claude esta disponivel", async () => {
    const expiredResetAt = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const chromeMock = createChromeMock({
      resetAt: expiredResetAt,
      topic: "claude-topic",
      orgId: TEST_ORG_ID
    });
    const [releasedResponse] = createClaudeUsageFetchMock({
      utilization: 20,
      resetsAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(releasedResponse)
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const api = loadBackground({ chromeMock, fetchMock });
    await api.initializeScheduling();

    expect(chromeMock.state.resetAt).toBeUndefined();
    expect(chromeMock.createdAlarms).toEqual([
      expect.objectContaining({
        name: api.POLL_ALARM,
        info: { periodInMinutes: api.POLL_INTERVAL_MINUTES }
      })
    ]);
    expect(chromeMock.createdNotifications).toEqual([
      expect.objectContaining({
        title: "Claude liberado",
        message: "Claude liberado agora. Uso atual: 20% do limite de 5 horas."
      })
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://ntfy.sh/claude-topic",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("initializeScheduling nao notifica quando nao ha storedResetAt", async () => {
    const chromeMock = createChromeMock({ orgId: TEST_ORG_ID });
    const [availableResponse] = createClaudeUsageFetchMock({
      utilization: 10,
      resetsAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    });
    const fetchMock = vi.fn().mockResolvedValueOnce(availableResponse);

    const api = loadBackground({ chromeMock, fetchMock });
    await api.initializeScheduling();

    expect(chromeMock.createdNotifications).toEqual([]);
    expect(chromeMock.createdAlarms).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: api.POLL_ALARM })
      ])
    );
  });
});