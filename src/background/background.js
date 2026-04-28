const DEFAULT_ORG_ID = "";
const POLL_ALARM = "checkClaudePoll";
const UNLOCK_ALARM = "checkClaudeUnlock";
const POLL_INTERVAL_MINUTES = 15;
const UNLOCK_GRACE_MS = 60 * 1000;
const NOTIFICATION_ICON_PATH = "assets/icons/icon-128.png";

if (!globalThis.__claudeNotifierShared && typeof importScripts === "function") {
  importScripts("../shared/shared-i18n.js");
  importScripts("../shared/shared-notifications.js");
}

const { sendNtfyNotification } = globalThis.__claudeNotifierShared || {};
const { getMessage, initializeI18n } = globalThis.__claudeNotifierI18n || {};

if (!sendNtfyNotification) {
  throw new Error("shared-notifications.js nao foi carregado antes de background.js");
}

if (!getMessage || !initializeI18n) {
  throw new Error("shared-i18n.js nao foi carregado antes de background.js");
}

let opened = false;

function getNotificationTitle(state) {
  if (state === "available") {
    return getMessage("notificationTitleAvailable");
  }

  if (state === "blocked") {
    return getMessage("notificationTitleBlocked");
  }

  return getMessage("notificationTitleError");
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
  await initializeI18n(true);
  const topic = await getTopic();
  if (!topic) return;

  await sendNtfyNotification(topic, msg, getMessage("notificationSenderTitle"));
}

async function notifyStatusResult(result) {
  await initializeI18n(true);
  const title = getNotificationTitle(result.state);

  const notificationResult = await showLocalNotification(title, result.message);
  let remoteSent = false;

  try {
    remoteSent = await notifyWithTitle(result.message, title);
  } catch (error) {
    await showLocalNotification(
      getMessage("localNotificationFailureTitle"),
      error?.message || getMessage("localNotificationFailureMessage")
    );
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

    if (!orgId) {
      return { error: "missing-org-id" };
    }

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

function formatResetDateTime(isoString) {
  const date = new Date(isoString);
  // Detect locale from i18n
  let locale = "pt-BR";
  if (typeof globalThis.__claudeNotifierI18n?.getCurrentLocale === "function") {
    locale = globalThis.__claudeNotifierI18n.getCurrentLocale();
  }
  // Dia da semana abreviado/localizado
  const weekday = date.toLocaleDateString(locale, { weekday: "long" });
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${weekday}, ${day}/${month} ${hours}:${minutes}`;
}

function buildSevenDayInfo(data) {
  const sevenDay = data?.seven_day;

  if (!sevenDay || sevenDay.utilization == null) {
    return "";
  }

  const util = Math.round(Number(sevenDay.utilization) || 0);

  if (sevenDay.resets_at) {
    return getMessage("statusSevenDayWithReset", [util, formatResetDateTime(sevenDay.resets_at)]);
  }

  return getMessage("statusSevenDayUsage", util);
}

function isSevenDayBlocked(data) {
  const sevenDay = data?.seven_day;

  if (!sevenDay || sevenDay.utilization == null) {
    return null;
  }

  const util = Number(sevenDay.utilization) || 0;
  const remaining = sevenDay.resets_at ? getRemaining(sevenDay.resets_at) : 0;

  if (util >= 100 && remaining > 0) {
    return { resetsAt: sevenDay.resets_at, remaining };
  }

  return null;
}

async function getClaudeStatus(overrideOrgId) {
  await initializeI18n(true);
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
  await initializeI18n(true);
  const result = await fetchUsage(overrideOrgId, { openTabOnFailure });

  if (result.error === "missing-org-id") {
    return createStatusResult(false, "missing-org-id", getMessage("statusOrgIdRequired"));
  }

  if (result.error === "auth") {
    return createStatusResult(false, "auth", getMessage("statusAuth"));
  }

  if (result.error) {
    return createStatusResult(false, "unavailable", getMessage("statusUnavailable"));
  }

  const usage = result.data?.five_hour;

  if (!usage) {
    return createStatusResult(false, "unavailable", getMessage("statusUnexpectedResponse"));
  }

  const utilization = Number(usage.utilization) || 0;
  const remaining = getRemaining(usage.resets_at);
  const storedResetAt = await getStoredResetAt();

  const fiveHourBlocked = utilization >= 100 && remaining > 0;
  const sevenDayBlock = isSevenDayBlocked(result.data);
  const isBlocked = fiveHourBlocked || sevenDayBlock;

  if (isBlocked) {
    const latestResetAt = sevenDayBlock && (!usage.resets_at || new Date(sevenDayBlock.resetsAt) > new Date(usage.resets_at))
      ? sevenDayBlock.resetsAt
      : usage.resets_at;

    if (updateSchedule) {
      await setStoredResetAt(latestResetAt);
      scheduleUnlockAlarm(latestResetAt);
    }

    const parts = [];

    if (fiveHourBlocked) {
      parts.push(getMessage("statusBlockedMessage", formatRemaining(remaining)));
    }

    if (sevenDayBlock) {
      parts.push(buildSevenDayInfo(result.data));
    }

    return {
      ok: true,
      state: "blocked",
      message: parts.filter(Boolean).join("\n")
    };
  }

  if (updateSchedule) {
    await clearStoredResetAt();
    schedulePollingAlarm();
  }

  const sevenDayInfo = buildSevenDayInfo(result.data);
  const availableMsg = getMessage("statusAvailableMessage", Math.round(utilization))
    + (sevenDayInfo ? "\n" + sevenDayInfo : "");

  const availableResult = {
    ok: true,
    state: "available",
    message: availableMsg
  };

  if (notifyOnUnlock && storedResetAt) {
    try {
      await notifyStatusResult(availableResult);
    } catch (error) {
      console.error("Failed to notify Claude unlock", error);
    }
  }

  return availableResult;
}

async function check() {
  await evaluateClaudeState();
}

async function initializeScheduling() {
  await initializeI18n(true);
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
              ? getMessage("detailLocalNotificationFailedRemoteSent", notificationResult.error)
              : getMessage("detailLocalNotificationFailedOnlyLocal", notificationResult.error);
          }
        } catch (error) {
          sendResponse({
            ok: false,
            state: "notify-error",
            message: getMessage("statusNotifyFailureWithError", error?.message || getMessage("unknownError"))
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
        message: error?.message || getMessage("statusUnexpectedCheckFailure")
      };

      if (message.notifyResult) {
        try {
          await notifyStatusResult(errorResult);
        } catch {
          sendResponse({
            ok: false,
            state: "notify-error",
            message: getMessage("statusErrorNotificationFailure")
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
    formatResetDateTime,
    buildSevenDayInfo,
    isSevenDayBlocked,
    getClaudeStatus,
    evaluateClaudeState,
    check,
    initializeScheduling
  };
} else {
  initializeScheduling();
}