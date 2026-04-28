// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const popupHtml = fs.readFileSync(path.resolve(process.cwd(), "src/popup/popup.html"), "utf8");
const pixConfigSource = fs.readFileSync(
  path.resolve(process.cwd(), "src/popup/popup-pix-config.js"),
  "utf8"
);
const donationConfigSource = fs.readFileSync(
  path.resolve(process.cwd(), "src/popup/popup-donations-config.js"),
  "utf8"
);
const sharedI18nSource = fs.readFileSync(
  path.resolve(process.cwd(), "src/shared/shared-i18n.js"),
  "utf8"
);
const popupSource = fs.readFileSync(path.resolve(process.cwd(), "src/popup/popup.js"), "utf8");
const sharedNotificationsSource = fs.readFileSync(
  path.resolve(process.cwd(), "src/shared/shared-notifications.js"),
  "utf8"
);

function createChromeMock(overrides = {}) {
  const storageState = {
    topic: "",
    orgId: "",
    language: overrides.storageState?.language ?? "auto",
    ...overrides.storageState
  };

  return {
    storageState,
    chrome: {
      runtime: {
        lastError: null,
        sendMessage: vi.fn((payload, callback) => {
          callback(overrides.messageResponse ?? { state: "available", message: "Claude liberado" });
        })
      },
      i18n: {
        getMessage: vi.fn(() => ""),
        getUILanguage: vi.fn(() => overrides.uiLanguage ?? "pt-BR")
      },
      storage: {
        local: {
          get: vi.fn((keys, callback) => {
            callback({
              topic: storageState.topic,
              orgId: storageState.orgId,
              language: storageState.language
            });
          }),
          set: vi.fn((value, callback) => {
            Object.assign(storageState, value);
            callback?.();
          })
        }
      }
    }
  };
}

function loadPopup({ chromeMock, fetchMock }) {
  document.documentElement.innerHTML = popupHtml;

  const context = {
    chrome: chromeMock.chrome,
    fetch: fetchMock,
    document,
    window,
    console,
    Promise,
    __CLAUDE_NOTIFIER_TEST__: true
  };

  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(pixConfigSource, context);
  vm.runInContext(donationConfigSource, context);
  vm.runInContext(sharedI18nSource, context);
  vm.runInContext(sharedNotificationsSource, context);
  vm.runInContext(popupSource, context);

  return {
    api: context.__claudeNotifierPopup,
    elements: {
      form: document.getElementById("configForm"),
      topic: document.getElementById("topic"),
      orgId: document.getElementById("orgId"),
      language: document.getElementById("language"),
      status: document.getElementById("status"),
      statusDetail: document.getElementById("statusDetail"),
      donationPanel: document.getElementById("donationPanel"),
      save: document.getElementById("save"),
      test: document.getElementById("test"),
      checkStatus: document.getElementById("checkStatus")
    }
  };
}

describe("popup.js", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  async function submitForm(elements) {
    await elements.form.onsubmit({ preventDefault() {} });
  }

  async function flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  }

  it("carrega os valores salvos no storage ao inicializar", () => {
    const chromeMock = createChromeMock({
      storageState: {
        topic: "topic-salvo",
        orgId: "org-salva"
      }
    });
    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    expect(elements.topic.value).toBe("topic-salvo");
    expect(elements.orgId.value).toBe("org-salva");
    expect(elements.language.value).toBe("auto");
  });

  it("deixa o Org ID em branco na primeira abertura quando nada foi salvo", () => {
    const chromeMock = createChromeMock({
      storageState: {
        topic: "",
        orgId: ""
      }
    });
    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    expect(elements.orgId.value).toBe("");
    expect(elements.orgId.getAttribute("placeholder")).toBe("");
  });

  it("associa os campos aos textos de ajuda e anuncia erros de validacao", async () => {
    const chromeMock = createChromeMock();
    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    expect(elements.topic.getAttribute("aria-describedby")).toBe("topicHint");
    expect(elements.orgId.getAttribute("aria-describedby")).toBe("orgIdHint");

    await elements.test.onclick();

    expect(elements.topic.getAttribute("aria-invalid")).toBe("true");
    expect(elements.topic.getAttribute("aria-describedby")).toBe("topicHint status");
    expect(elements.status.getAttribute("role")).toBe("alert");
    expect(elements.status.getAttribute("aria-live")).toBe("assertive");
  });

  it("renderiza a ajuda com instrucoes para recuperar o Org ID e configurar o ntfy", () => {
    const chromeMock = createChromeMock();

    loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    const helpPanel = document.querySelector(".help-panel");

    expect(helpPanel).not.toBeNull();
    expect(helpPanel.textContent).toContain("claude.ai/settings/usage");
    expect(helpPanel.textContent).toContain("https://claude.ai/api/organizations/{ID}/usage");
    expect(helpPanel.textContent).toContain("Tópico do ntfy");
    expect(helpPanel.textContent).toContain("Inspecione o navegador");
  });

  it("renderiza as opcoes de doacao a partir do arquivo de configuracao", () => {
    const chromeMock = createChromeMock();
    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    expect(elements.donationPanel.hidden).toBe(false);
    expect(elements.donationPanel.textContent).toContain("Apoie a extensao");
    expect(elements.donationPanel.textContent).toContain("Buy Me a Coffee");
    expect(elements.donationPanel.querySelectorAll(".donation-method")).toHaveLength(2);
    expect(elements.donationPanel.textContent).toContain("b74edbf6-006e-4831-a87d-da0e451c2819");
    expect(elements.donationPanel.querySelector(".donation-pix-qr-image")?.getAttribute("src")).toContain("quickchart.io/qr");
    expect(
      Array.from(elements.donationPanel.querySelectorAll(".donation-method-link")).some(
        (link) => link.href === "https://buymeacoffee.com/soarescaldi"
      )
    ).toBe(true);
  });

  it("traduz a secao de doacoes ao trocar o idioma", async () => {
    const chromeMock = createChromeMock({ storageState: { language: "auto" }, uiLanguage: "pt-BR" });
    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    elements.language.value = "en";
    await elements.language.onchange();

    expect(elements.donationPanel.textContent).toContain("Support the extension");
    expect(elements.donationPanel.textContent).toContain("Quick to activate and simple for one-time donations");
  });

  it("gera um payload Pix estatico para o QR Code", () => {
    const chromeMock = createChromeMock();
    const { api } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    const payload = api.buildPixPayload({
      pixKey: "b74edbf6-006e-4831-a87d-da0e451c2819",
      merchantName: "Daniel Soares",
      merchantCity: "Sao Paulo",
      transactionId: "CLAUDENOTIFIER"
    });

    expect(payload.startsWith("00020126")).toBe(true);
    expect(payload).toContain("BR.GOV.BCB.PIX");
    expect(payload).toContain("b74edbf6-006e-4831-a87d-da0e451c2819");
    expect(payload.includes("6304")).toBe(true);
  });

  it("salva configuracao valida e atualiza a mensagem de status", async () => {
    const chromeMock = createChromeMock({ storageState: { topic: "", orgId: "" } });
    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    elements.topic.value = "novo-topico";
    elements.orgId.value = "nova-org";
    await submitForm(elements);

    expect(chromeMock.chrome.storage.local.set).toHaveBeenCalledWith(
      { topic: "novo-topico", orgId: "nova-org", language: "auto" },
      expect.any(Function)
    );
    expect(chromeMock.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: "GET_CLAUDE_STATUS", orgId: "nova-org", notifyResult: false },
      expect.any(Function)
    );
    expect(elements.status.textContent).toContain("Configuração salva");
    expect(elements.status.className).toBe("status success");
  });

  it("sincroniza o background ao salvar uma configuracao com Org ID", async () => {
    const chromeMock = createChromeMock({ storageState: { topic: "", orgId: "" } });
    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    elements.topic.value = "claude-topic";
    elements.orgId.value = "org-sync";
  await submitForm(elements);

    expect(chromeMock.chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
    expect(chromeMock.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: "GET_CLAUDE_STATUS", orgId: "org-sync", notifyResult: false },
      expect.any(Function)
    );
  });

  it("nao sincroniza o background ao salvar sem Org ID", async () => {
    const chromeMock = createChromeMock({ storageState: { topic: "", orgId: "" } });
    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    elements.topic.value = "claude-topic";
    elements.orgId.value = "";
    await submitForm(elements);

    expect(chromeMock.chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it("permite salvar o idioma mesmo sem topico e atualiza o feedback", async () => {
    const chromeMock = createChromeMock({ storageState: { topic: "", orgId: "org-salva", language: "auto" } });
    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    elements.language.value = "es";
    await submitForm(elements);

    expect(chromeMock.chrome.storage.local.set).toHaveBeenCalledWith(
      { topic: "", orgId: "org-salva", language: "es" },
      expect.any(Function)
    );
    expect(elements.status.textContent).toContain("Añade un tema de ntfy");
    expect(elements.save.textContent).toBe("Guardar configuración");
    expect(elements.checkStatus.textContent).toBe("Comprobar estado de Claude");
  });

  it("troca os textos imediatamente ao mudar o seletor de idioma", async () => {
    const chromeMock = createChromeMock({ storageState: { language: "auto" }, uiLanguage: "pt-BR" });
    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    elements.language.value = "es";
    await elements.language.onchange();

    expect(document.documentElement.lang).toBe("es");
    expect(elements.save.textContent).toBe("Guardar configuración");
    expect(elements.test.textContent).toBe("Enviar prueba");
    expect(elements.checkStatus.textContent).toBe("Comprobar estado de Claude");
    expect(elements.status.textContent).toContain("Indica un tema de ntfy");
  });

  it("localiza textos auxiliares de acessibilidade ao trocar o idioma", async () => {
    const chromeMock = createChromeMock({ storageState: { language: "auto" }, uiLanguage: "pt-BR" });
    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    elements.language.value = "en";
    await elements.language.onchange();

    expect(document.querySelector(".help-panel a .sr-only")?.textContent).toBe(" (opens in a new tab)");
    expect(elements.donationPanel.querySelector(".donation-pix-qr-image")?.getAttribute("alt")).toContain("QR code");
  });

  it("envia notificacao de teste para o ntfy", async () => {
    const chromeMock = createChromeMock();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const { elements } = loadPopup({ chromeMock, fetchMock });

    elements.topic.value = "meu-topico";
    await elements.test.onclick();

    expect(fetchMock).toHaveBeenCalledWith("https://ntfy.sh/meu-topico", expect.objectContaining({
      method: "POST",
      body: "Teste de notificação do Claude!"
    }));
    expect(elements.status.textContent).toContain("sucesso");
  });

  it("consulta o background e mostra erro quando Claude esta bloqueado", async () => {
    const chromeMock = createChromeMock({
      storageState: {
        orgId: "org-salva"
      },
      messageResponse: {
        state: "blocked",
        message: "Claude bloqueado por mais 10min"
      }
    });
    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    await elements.checkStatus.onclick();

    expect(chromeMock.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: "GET_CLAUDE_STATUS", orgId: "org-salva", notifyResult: true },
      expect.any(Function)
    );
    expect(elements.status.textContent).toContain("Claude bloqueado");
    expect(elements.status.className).toBe("status error");
  });

  it("consulta automaticamente o status ao abrir o popup quando ja existe configuracao salva", async () => {
    const chromeMock = createChromeMock({
      storageState: {
        topic: "topic-salvo",
        orgId: "org-salva"
      },
      messageResponse: {
        state: "available",
        message: "Claude liberado"
      }
    });

    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    await flushMicrotasks();

    expect(chromeMock.chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: "GET_CLAUDE_STATUS", orgId: "org-salva", notifyResult: true },
      expect.any(Function)
    );
    expect(elements.status.textContent).toBe("Claude liberado");
    expect(elements.status.className).toBe("status success");
  });

  it("nao consulta automaticamente o status quando existe topico salvo mas falta Org ID", async () => {
    const chromeMock = createChromeMock({
      storageState: {
        topic: "topic-salvo",
        orgId: ""
      }
    });

    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    await flushMicrotasks();

    expect(chromeMock.chrome.runtime.sendMessage).not.toHaveBeenCalled();
    expect(elements.status.textContent).toContain("Informe um tópico do ntfy");
  });

  it("impede a consulta manual quando o Org ID esta vazio", async () => {
    const chromeMock = createChromeMock({
      storageState: {
        topic: "topic-salvo",
        orgId: ""
      }
    });
    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    await flushMicrotasks();

    await elements.checkStatus.onclick();

    expect(chromeMock.chrome.runtime.sendMessage).not.toHaveBeenCalled();
    expect(elements.status.textContent).toContain("Digite o Org ID do Claude antes de consultar o status.");
    expect(document.activeElement).toBe(elements.orgId);
  });

  it("mostra o motivo real quando o envio da notificacao falha", async () => {
    const chromeMock = createChromeMock({
      storageState: {
        orgId: "org-salva"
      },
      messageResponse: {
        state: "notify-error",
        message: "O status foi consultado, mas houve falha ao enviar a notificacao: ntfy request failed with status 403"
      }
    });
    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    await elements.checkStatus.onclick();

    expect(elements.status.textContent).toBe(
      "O status foi consultado, mas houve falha ao enviar a notificacao: ntfy request failed with status 403"
    );
    expect(elements.status.className).toBe("status error");
  });

  it("mostra um aviso separado quando o ntfy foi enviado mas a notificacao local falhou", async () => {
    const chromeMock = createChromeMock({
      storageState: {
        orgId: "org-salva"
      },
      messageResponse: {
        state: "available",
        message: "Claude liberado",
        detailMessage: "ntfy enviado, mas a notificacao local nao foi exibida: Unable to download all specified images.",
        detailTone: "warning"
      }
    });
    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    await elements.checkStatus.onclick();

    expect(elements.status.textContent).toBe("Claude liberado");
    expect(elements.status.className).toBe("status success");
    expect(elements.statusDetail.textContent).toBe(
      "ntfy enviado, mas a notificacao local nao foi exibida: Unable to download all specified images."
    );
    expect(elements.statusDetail.className).toBe("status-detail warning");
    expect(elements.statusDetail.hidden).toBe(false);
  });

  it("prioriza o idioma salvo pelo usuario sobre o idioma do navegador", async () => {
    const chromeMock = createChromeMock({
      uiLanguage: "pt-BR",
      storageState: {
        language: "en"
      }
    });

    const { elements } = loadPopup({
      chromeMock,
      fetchMock: vi.fn()
    });

    await flushMicrotasks();

    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toBe("Claude Notifier Pro");
    expect(elements.save.textContent).toBe("Save configuration");
    expect(elements.checkStatus.textContent).toBe("Check Claude status");
    expect(document.querySelector(".help-panel")?.textContent).toContain("Open the page");
    expect(elements.status.textContent).toContain("Enter an ntfy topic");
  });
});