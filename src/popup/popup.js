const DEFAULT_ORG_ID = "";
const BUTTON_LABEL_KEYS = {
  save: {
    idle: "saveButtonIdle",
    busy: "saveButtonBusy"
  },
  test: {
    idle: "testButtonIdle",
    busy: "testButtonBusy"
  },
  status: {
    idle: "checkStatusButtonIdle",
    busy: "checkStatusButtonBusy"
  }
};
const STATUS_TONE_BY_STATE = {
  available: "success",
  blocked: "error"
};
const FIELD_HINT_IDS = Object.freeze({
  orgId: "orgIdHint",
  topic: "topicHint",
  language: "languageHint"
});
const DONATIONS_CONFIG = globalThis.__claudeNotifierDonationsConfig || null;
const { sendNtfyNotification } = globalThis.__claudeNotifierShared || {};
const {
  AUTO_LANGUAGE_VALUE,
  getCurrentLanguageSetting,
  getMessage,
  initializeI18n,
  localizeDocument,
  setLanguagePreference
} = globalThis.__claudeNotifierI18n || {};

if (!sendNtfyNotification) {
  throw new Error("shared-notifications.js nao foi carregado antes de popup.js");
}

if (!getMessage || !localizeDocument || !initializeI18n || !setLanguagePreference) {
  throw new Error("shared-i18n.js nao foi carregado antes de popup.js");
}

function getLocalizedConfigValue(value, language) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value[language] || value.default || "";
}

function formatPixField(id, value) {
  const serializedValue = String(value);

  return `${id}${serializedValue.length.toString().padStart(2, "0")}${serializedValue}`;
}

function normalizePixMerchantValue(value, maxLength) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .slice(0, maxLength);
}

function computePixCrc16(payload) {
  let crc = 0xffff;

  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function buildPixPayload(method) {
  if (!method?.pixKey) {
    return "";
  }

  const merchantName = normalizePixMerchantValue(method.merchantName || "DANIEL SOARES", 25) || "DANIEL SOARES";
  const merchantCity = normalizePixMerchantValue(method.merchantCity || "SAO PAULO", 15) || "SAO PAULO";
  const merchantAccountInfo = `${formatPixField("00", "BR.GOV.BCB.PIX")}${formatPixField("01", method.pixKey)}`;
  const transactionId = normalizePixMerchantValue(method.transactionId || "***", 25) || "***";
  const additionalDataField = formatPixField("62", formatPixField("05", transactionId));
  const payloadWithoutCrc = [
    formatPixField("00", "01"),
    formatPixField("26", merchantAccountInfo),
    formatPixField("52", "0000"),
    formatPixField("53", "986"),
    formatPixField("58", "BR"),
    formatPixField("59", merchantName),
    formatPixField("60", merchantCity),
    additionalDataField,
    "6304"
  ].join("");

  return `${payloadWithoutCrc}${computePixCrc16(payloadWithoutCrc)}`;
}

function getPixQrCodeUrl(method) {
  const payload = buildPixPayload(method);

  if (!payload) {
    return "";
  }

  return `https://quickchart.io/qr?margin=1&size=220&text=${encodeURIComponent(payload)}`;
}

function appendPixQrCode(doc, method, content, language) {
  if (!method?.pixKey) {
    return;
  }

  const qrWrapper = doc.createElement("div");
  qrWrapper.className = "donation-pix-qr";

  const qrImage = doc.createElement("img");
  qrImage.className = "donation-pix-qr-image";
  qrImage.alt = getMessage("donationPixQrAlt", getLocalizedConfigValue(method.label, language));
  qrImage.src = getPixQrCodeUrl(method);
  qrImage.decoding = "async";
  qrImage.loading = "lazy";

  const qrKey = doc.createElement("code");
  qrKey.className = "donation-pix-key";
  qrKey.tabIndex = 0;
  qrKey.textContent = method.pixKey;

  qrWrapper.append(qrImage, qrKey);
  content.append(qrWrapper);
}

function renderDonationPanel(doc = document) {
  const donationPanel = doc.getElementById("donationPanel");

  if (!donationPanel) {
    return;
  }

  if (!DONATIONS_CONFIG?.enabled || !Array.isArray(DONATIONS_CONFIG.methods) || !DONATIONS_CONFIG.methods.length) {
    donationPanel.hidden = true;
    return;
  }

  const language = getCurrentLanguageSetting?.() || doc.documentElement.lang || "pt-BR";
  const titleElement = donationPanel.querySelector(".donation-title");
  const copyElement = donationPanel.querySelector(".donation-copy");
  const methodsContainer = donationPanel.querySelector("#donationMethods");

  titleElement.textContent = getLocalizedConfigValue(DONATIONS_CONFIG.title, language);
  copyElement.textContent = getLocalizedConfigValue(DONATIONS_CONFIG.description, language);
  methodsContainer.replaceChildren();

  for (const method of DONATIONS_CONFIG.methods) {
    const item = doc.createElement("article");
    item.className = `donation-method${method.prominent ? " prominent" : ""}`;
    const methodLabel = getLocalizedConfigValue(method.label, language);

    const content = doc.createElement("div");
    content.className = "donation-method-content";

    const methodTitle = doc.createElement("p");
    methodTitle.className = "donation-method-title";
    methodTitle.textContent = methodLabel;

    const methodHint = doc.createElement("p");
    methodHint.className = "donation-method-hint";
    methodHint.textContent = getLocalizedConfigValue(method.hint, language);

    content.append(methodTitle, methodHint);

    if (method.id === "pix") {
      appendPixQrCode(doc, method, content, language);
    }

    item.append(content);

    if (method.url) {
      const link = doc.createElement("a");
      link.className = "donation-method-link";
      link.href = method.url;
      link.target = "_blank";
      link.rel = "noreferrer noopener";
      link.textContent = methodLabel;
      link.setAttribute("aria-label", getMessage("donationLinkAriaLabel", methodLabel));
      item.append(link);
    }

    methodsContainer.append(item);
  }

  donationPanel.hidden = false;
}

function applyStaticLocalization(doc, { preserveStatus = false } = {}) {
  const status = preserveStatus ? doc.getElementById("status") : null;
  const statusSnapshot = status
    ? {
        textContent: status.textContent,
        className: status.className
      }
    : null;

  localizeDocument(doc);
  doc.title = getMessage("popupDocumentTitle");
  renderDonationPanel(doc);

  if (statusSnapshot) {
    status.textContent = statusSnapshot.textContent;
    status.className = statusSnapshot.className;
  }
}

function setStatus(statusElement, message, tone = "info") {
  statusElement.setAttribute("role", tone === "error" ? "alert" : "status");
  statusElement.setAttribute("aria-live", tone === "error" ? "assertive" : "polite");
  statusElement.setAttribute("aria-atomic", "true");
  statusElement.textContent = message;
  statusElement.className = `status ${tone}`;
}

function setStatusDetail(detailElement, message = "", tone = "info") {
  detailElement.setAttribute("role", tone === "error" ? "alert" : "status");
  detailElement.setAttribute("aria-live", tone === "error" ? "assertive" : "polite");
  detailElement.setAttribute("aria-atomic", "true");
  detailElement.textContent = message;
  detailElement.className = `status-detail ${tone}`;
  detailElement.hidden = !message;
}

function setBusy(button, isBusy, idleLabel, busyLabel) {
  button.disabled = isBusy;
  button.setAttribute("aria-busy", String(isBusy));
  button.setAttribute("aria-disabled", String(isBusy));
  button.textContent = isBusy ? busyLabel : idleLabel;
}

function getTrimmedValue(input, fallback = "") {
  return input.value.trim() || fallback;
}

function getResultTone(state) {
  return STATUS_TONE_BY_STATE[state] || "error";
}

function setStatusFeedback(statusElement, detailElement, message, tone = "info", detailMessage = "", detailTone = "info") {
  setStatus(statusElement, message, tone);
  setStatusDetail(detailElement, detailMessage, detailTone);
}

function applyStatusResult(statusElement, detailElement, result) {
  setStatusFeedback(
    statusElement,
    detailElement,
    result?.message || getMessage("statusDefaultMessage"),
    getResultTone(result?.state),
    result?.detailMessage,
    result?.detailTone
  );
}

function getFieldHintId(input) {
  return FIELD_HINT_IDS[input?.id] || "";
}

function setFieldErrorState(input, hasError, { includeStatus = false } = {}) {
  if (!input) {
    return;
  }

  const describedByIds = [getFieldHintId(input)];

  if (includeStatus) {
    describedByIds.push("status");
  }

  if (hasError) {
    input.setAttribute("aria-invalid", "true");
  } else {
    input.removeAttribute("aria-invalid");
  }

  input.setAttribute("aria-describedby", describedByIds.filter(Boolean).join(" "));
}

function clearFieldErrorState(...inputs) {
  inputs.forEach((input) => setFieldErrorState(input, false));
}

function focusInputWithError(input, statusElement, detailElement, message) {
  setStatusFeedback(statusElement, detailElement, message, "error");
  setFieldErrorState(input, true, { includeStatus: true });
  input.focus();
}

function getButtonLabels(kind) {
  const keys = BUTTON_LABEL_KEYS[kind];

  return {
    idle: getMessage(keys.idle),
    busy: getMessage(keys.busy)
  };
}

async function withBusyState(button, labels, action) {
  const form = button?.form || button?.closest?.("form");

  form?.setAttribute("aria-busy", "true");
  setBusy(button, true, labels.idle, labels.busy);

  try {
    return await action();
  } finally {
    setBusy(button, false, labels.idle, labels.busy);
    form?.setAttribute("aria-busy", "false");
  }
}

function loadStoredConfiguration(input, orgIdInput, languageInput) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["topic", "orgId", "language"], (data) => {
      if (data.topic) {
        input.value = data.topic;
      }

      orgIdInput.value = data.orgId || DEFAULT_ORG_ID;
      languageInput.value = data.language || AUTO_LANGUAGE_VALUE;

      resolve({
        topic: data.topic || "",
        orgId: data.orgId || DEFAULT_ORG_ID,
        language: data.language || AUTO_LANGUAGE_VALUE
      });
    });
  });
}

function saveConfiguration(topic, orgId, language) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ topic, orgId, language }, resolve);
  });
}

function requestClaudeStatus(orgId, notifyResult = false) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "GET_CLAUDE_STATUS", orgId, notifyResult }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(response);
    });
  });
}

async function synchronizeBackgroundMonitoring(orgId) {
  if (!orgId) {
    return null;
  }

  try {
    return await requestClaudeStatus(orgId, false);
  } catch {
    return null;
  }
}

async function performStatusCheck(orgId, checkStatusButton, status, statusDetail) {
  if (!orgId) {
    setStatusFeedback(status, statusDetail, getMessage("statusOrgIdRequired"), "error");
    return;
  }

  await withBusyState(checkStatusButton, getButtonLabels("status"), async () => {
    try {
      setStatusFeedback(status, statusDetail, getMessage("statusChecking"), "info");
      const result = await requestClaudeStatus(orgId, true);
      applyStatusResult(status, statusDetail, result);
    } catch {
      setStatusFeedback(status, statusDetail, getMessage("statusCheckFailure"), "error");
    }
  });
}

function initializePopup(doc = document) {
  const form = doc.getElementById("configForm");
  const input = doc.getElementById("topic");
  const orgIdInput = doc.getElementById("orgId");
  const languageInput = doc.getElementById("language");
  const status = doc.getElementById("status");
  const statusDetail = doc.getElementById("statusDetail");
  const saveButton = doc.getElementById("save");
  const testButton = doc.getElementById("test");
  const checkStatusButton = doc.getElementById("checkStatus");

  form?.setAttribute("aria-busy", "true");
  clearFieldErrorState(input, orgIdInput, languageInput);

  input.addEventListener("input", () => setFieldErrorState(input, false));
  orgIdInput.addEventListener("input", () => setFieldErrorState(orgIdInput, false));
  languageInput.addEventListener("change", () => setFieldErrorState(languageInput, false));

  const configurationPromise = loadStoredConfiguration(input, orgIdInput, languageInput);
  applyStaticLocalization(doc);

  Promise.all([initializeI18n(true), configurationPromise]).then(async ([, configuration]) => {
    languageInput.value = getCurrentLanguageSetting();
    applyStaticLocalization(doc);

    if (configuration.topic && configuration.orgId) {
      const orgId = configuration.orgId || DEFAULT_ORG_ID;
      await performStatusCheck(orgId, checkStatusButton, status, statusDetail);
    }
  }).finally(() => {
    form?.setAttribute("aria-busy", "false");
  });

  languageInput.onchange = async () => {
    await setLanguagePreference(languageInput.value || AUTO_LANGUAGE_VALUE, { persist: false });
    applyStaticLocalization(doc, { preserveStatus: true });
  };

  form.onsubmit = async (event) => {
    event.preventDefault();

    const topic = getTrimmedValue(input);
    const orgId = getTrimmedValue(orgIdInput, DEFAULT_ORG_ID);
    const language = languageInput.value || AUTO_LANGUAGE_VALUE;

    clearFieldErrorState(input, orgIdInput, languageInput);

    await withBusyState(saveButton, getButtonLabels("save"), async () => {
      await setLanguagePreference(language, { persist: false });
      await saveConfiguration(topic, orgId, language);
      await synchronizeBackgroundMonitoring(orgId);
      applyStaticLocalization(doc, { preserveStatus: true });
      setStatusFeedback(
        status,
        statusDetail,
        topic ? getMessage("statusSaveSuccess") : getMessage("statusSaveSuccessWithoutTopic"),
        "success"
      );
    });

    applyStaticLocalization(doc, { preserveStatus: true });
  };

  testButton.onclick = async () => {
    const topic = getTrimmedValue(input);

    if (!topic) {
      focusInputWithError(input, status, statusDetail, getMessage("statusTopicRequiredTest"));
      return;
    }

    clearFieldErrorState(input);

    await withBusyState(testButton, getButtonLabels("test"), async () => {
      try {
        setStatusFeedback(status, statusDetail, getMessage("statusSendingTest"), "info");
        await sendNtfyNotification(
          topic,
          getMessage("testNotificationBody"),
          getMessage("testNotificationTitle")
        );
        setStatusFeedback(status, statusDetail, getMessage("statusTestSuccess"), "success");
      } catch {
        setStatusFeedback(
          status,
          statusDetail,
          getMessage("statusTestFailure"),
          "error"
        );
      }
    });
  };

  checkStatusButton.onclick = async () => {
    const orgId = getTrimmedValue(orgIdInput, DEFAULT_ORG_ID);

    if (!orgId) {
      focusInputWithError(orgIdInput, status, statusDetail, getMessage("statusOrgIdRequired"));
      return;
    }

    clearFieldErrorState(orgIdInput);

    await performStatusCheck(orgId, checkStatusButton, status, statusDetail);
  };

  return {
    form,
    input,
    orgIdInput,
    languageInput,
    status,
    statusDetail,
    saveButton,
    testButton,
    checkStatusButton
  };
}

if (typeof document !== "undefined") {
  initializePopup();
}

if (globalThis.__CLAUDE_NOTIFIER_TEST__) {
  globalThis.__claudeNotifierPopup = {
    DEFAULT_ORG_ID,
    BUTTON_LABEL_KEYS,
    setStatus,
    setStatusDetail,
    setBusy,
    getTrimmedValue,
    getResultTone,
    setFieldErrorState,
    clearFieldErrorState,
    setStatusFeedback,
    applyStatusResult,
    focusInputWithError,
    formatPixField,
    normalizePixMerchantValue,
    computePixCrc16,
    buildPixPayload,
    getPixQrCodeUrl,
    withBusyState,
    loadStoredConfiguration,
    saveConfiguration,
    applyStaticLocalization,
    getLocalizedConfigValue,
    requestClaudeStatus,
    synchronizeBackgroundMonitoring,
    performStatusCheck,
    sendNtfyNotification,
    renderDonationPanel,
    initializePopup
  };
}