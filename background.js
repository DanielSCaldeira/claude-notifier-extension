const DEFAULT_ORG_ID = "109198ba-0b63-492d-9830-03c9bdb14874";
const POLL_ALARM = "checkClaudePoll";
const UNLOCK_ALARM = "checkClaudeUnlock";
const POLL_INTERVAL_MINUTES = 15;
const UNLOCK_GRACE_MS = 60 * 1000;
const NOTIFICATION_ICON_PATH = "icon-128.png";
const STATUS_TITLES = {
  available: "Claude liberado",
  blocked: "Claude bloqueado"
};
const STATUS_MESSAGES = {
  auth: "Sessao do Claude nao encontrada. Abra o claude.ai e faca login no navegador.",
  unavailable: "Nao foi possivel consultar o status agora. Tente novamente em instantes.",
  unexpectedResponse: "Resposta inesperada da API do Claude ao consultar o uso."
};

if (!globalThis.__claudeNotifierShared && typeof importScripts === "function") {
  importScripts("shared-notifications.js");
}

const { sendNtfyNotification } = globalThis.__claudeNotifierShared || {};

if (!sendNtfyNotification) {
  throw new Error("shared-notifications.js nao foi carregado antes de background.js");
}

let opened = false;

function getNotificationTitle(state) {
  return STATUS_TITLES[state] || "Erro ao consultar Claude";
}

function createStatusResult(ok, state, message) {
  return { ok, state, message };
}

function getLocalStorageValue(key, fallbackValue) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (data) => {
      resolve(data[key] ?? fallbackValue);
    });
  });
}

function setLocalStorageValue(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

function removeLocalStorageValue(key) {
  return new Promise((resolve) => {
    chrome.storage.local.remove([key], resolve);
  });
}

function showLocalNotification(title, message) {
  return new Promise((resolve) => {
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL(NOTIFICATION_ICON_PATH),
      title,
      message
    }, () => {
      const errorMessage = chrome.runtime.lastError?.message;

      if (errorMessage) {
        resolve({ ok: false, error: errorMessage });
        return;
      }

      resolve({ ok: true });
    });
  });
}

function openClaudeTabOnce() {
  if (!opened) {
    chrome.tabs.create({ url: "https://claude.ai" });
    opened = true;
  }
}

async function getTopic() {
  return getLocalStorageValue("topic");
}

async function getOrgId(overrideOrgId) {
  if (overrideOrgId) {
    return overrideOrgId;
  }

  return getLocalStorageValue("orgId", DEFAULT_ORG_ID);
}

async function notify(msg) {
  const topic = await getTopic();
  if (!topic) return;

  await sendNtfyNotification(topic, msg, "Claude Notifier");
}

async function notifyStatusResult(result) {
  const title = getNotificationTitle(result.state);

  const notificationResult = await showLocalNotification(title, result.message);
  let remoteSent = false;

  try {
    remoteSent = await notifyWithTitle(result.message, title);
  } catch (error) {
    await showLocalNotification("Falha ao enviar ntfy", error?.message || "Nao foi possivel enviar a notificacao remota.");
    throw error;
  }

  return {
    ...notificationResult,
    remoteSent
  };
}

async function notifyWithTitle(message, title) {
  const topic = await getTopic();
  if (!topic) return false;

  await sendNtfyNotification(topic, message, title);
  return true;
}

async function getStoredResetAt() {
  return getLocalStorageValue("resetAt", null);
}

async function setStoredResetAt(resetAt) {
  return setLocalStorageValue("resetAt", resetAt);
}

async function clearStoredResetAt() {
  return removeLocalStorageValue("resetAt");
}

function clearAlarm(name) {
  chrome.alarms.clear(name);
}

function schedulePollingAlarm() {
  clearAlarm(UNLOCK_ALARM);
  chrome.alarms.create(POLL_ALARM, { periodInMinutes: POLL_INTERVAL_MINUTES });
}

function scheduleUnlockAlarm(resetAt) {
  const unlockTime = new Date(resetAt).getTime() + UNLOCK_GRACE_MS;
  const when = unlockTime > Date.now() ? unlockTime : Date.now() + 5 * 1000;

  clearAlarm(POLL_ALARM);
  chrome.alarms.create(UNLOCK_ALARM, { when });
}

async function fetchUsage(overrideOrgId, { openTabOnFailure = true } = {}) {
  try {
    const orgId = await getOrgId(overrideOrgId);
    const res = await fetch(
      `https://claude.ai/api/organizations/${orgId}/usage`,
      { credentials: "include" }
    );

    if (res.status === 401 || res.status === 403) {
      if (openTabOnFailure) {
        openClaudeTabOnce();
      }

      return { error: "auth" };
    }

    if (!res.ok) {
      return { error: "request" };
    }

    return { data: await res.json() };

  } catch {
    if (openTabOnFailure) {
      openClaudeTabOnce();
    }

    return { error: "network" };
  }
}

function getRemaining(resetAt) {
  return new Date(resetAt) - new Date();
}

function formatRemaining(ms) {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}min`;
}

async function getClaudeStatus(overrideOrgId) {
  const result = await evaluateClaudeState({
    openTabOnFailure: false,
    overrideOrgId,
    notifyOnUnlock: false,
    updateSchedule: true
  });

  if (result.state === "blocked") {
    return {
      ok: true,
      state: result.state,
      message: result.message
    };
  }

  if (result.state === "available") {
    return {
      ok: true,
      state: result.state,
      message: result.message
    };
  }

  return {
    ok: false,
    state: result.state,
    message: result.message
  };
}

async function evaluateClaudeState({
  openTabOnFailure = true,
  overrideOrgId,
  notifyOnUnlock = false,
  updateSchedule = true
} = {}) {
  const result = await fetchUsage(overrideOrgId, { openTabOnFailure });

  if (result.error === "auth") {
    return createStatusResult(false, "auth", STATUS_MESSAGES.auth);
  }

  if (result.error) {
    return createStatusResult(false, "unavailable", STATUS_MESSAGES.unavailable);
  }

  const usage = result.data?.five_hour;

  if (!usage) {
    return createStatusResult(false, "unavailable", STATUS_MESSAGES.unexpectedResponse);
  }

  const utilization = Number(usage.utilization) || 0;
  const remaining = getRemaining(usage.resets_at);
  const storedResetAt = await getStoredResetAt();

  if (utilization >= 100 && remaining > 0) {
    if (updateSchedule) {
      await setStoredResetAt(usage.resets_at);
      scheduleUnlockAlarm(usage.resets_at);
    }

    return {
      ok: true,
      state: "blocked",
      message: `Claude bloqueado no momento. Libera em aproximadamente ${formatRemaining(remaining)}.`
    };
  }

  if (updateSchedule) {
    await clearStoredResetAt();
    schedulePollingAlarm();
  }

  if (notifyOnUnlock && storedResetAt) {
    await notify("🚀 Claude liberado!");
  }

  return {
    ok: true,
    state: "available",
    message: `Claude liberado agora. Uso atual: ${Math.round(utilization)}% do limite de 5 horas.`
  };
}

async function check() {
  await evaluateClaudeState();
}

async function initializeScheduling() {
  const storedResetAt = await getStoredResetAt();

  if (storedResetAt && getRemaining(storedResetAt) > 0) {
    scheduleUnlockAlarm(storedResetAt);
    return;
  }

  if (storedResetAt) {
    await evaluateClaudeState({ notifyOnUnlock: true });
    return;
  }

  schedulePollingAlarm();
  await check();
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === POLL_ALARM) {
    check();
  }

  if (alarm.name === UNLOCK_ALARM) {
    evaluateClaudeState({ notifyOnUnlock: true });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "GET_CLAUDE_STATUS") {
    return undefined;
  }

  getClaudeStatus(message.orgId)
    .then(async (result) => {
      const responsePayload = { ...result };

      if (message.notifyResult) {
        try {
          const notificationResult = await notifyStatusResult(result);

          if (!notificationResult.ok) {
            responsePayload.detailTone = "warning";
            responsePayload.detailMessage = notificationResult.remoteSent
              ? `ntfy enviado, mas a notificacao local nao foi exibida: ${notificationResult.error}`
              : `Nao foi possivel exibir a notificacao local: ${notificationResult.error}`;
          }
        } catch (error) {
          sendResponse({
            ok: false,
            state: "notify-error",
            message: `O status foi consultado, mas houve falha ao enviar a notificacao: ${error?.message || "erro desconhecido"}`
          });
          return;
        }
      }

      sendResponse(responsePayload);
    })
    .catch(async (error) => {
      const errorResult = {
        ok: false,
        state: "unavailable",
        message: error?.message || "Falha inesperada ao consultar o status do Claude."
      };

      if (message.notifyResult) {
        try {
          await notifyStatusResult(errorResult);
        } catch {
          sendResponse({
            ok: false,
            state: "notify-error",
            message: "Houve falha na consulta e tambem nao foi possivel enviar a notificacao de erro."
          });
          return;
        }
      }

      sendResponse(errorResult);
    });

  return true;
});

if (globalThis.__CLAUDE_NOTIFIER_TEST__) {
  globalThis.__claudeNotifierBackground = {
    DEFAULT_ORG_ID,
    POLL_ALARM,
    UNLOCK_ALARM,
    POLL_INTERVAL_MINUTES,
    UNLOCK_GRACE_MS,
    NOTIFICATION_ICON_PATH,
    STATUS_TITLES,
    STATUS_MESSAGES,
    getNotificationTitle,
    createStatusResult,
    getLocalStorageValue,
    setLocalStorageValue,
    removeLocalStorageValue,
    openClaudeTabOnce,
    sendNtfyNotification,
    getTopic,
    getOrgId,
    notify,
    notifyStatusResult,
    notifyWithTitle,
    getStoredResetAt,
    setStoredResetAt,
    clearStoredResetAt,
    schedulePollingAlarm,
    scheduleUnlockAlarm,
    fetchUsage,
    getRemaining,
    formatRemaining,
    getClaudeStatus,
    evaluateClaudeState,
    check,
    initializeScheduling
  };
} else {
  initializeScheduling();
}