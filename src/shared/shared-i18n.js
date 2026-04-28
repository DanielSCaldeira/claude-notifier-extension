(function installSharedI18n(target) {
  const STORAGE_LANGUAGE_KEY = "language";
  const AUTO_LANGUAGE_VALUE = "auto";
  const DEFAULT_LOCALE = "pt-BR";
  const LOCALE_CATALOGS = Object.freeze({
    "pt-BR": Object.freeze({
      extensionName: "Claude Notifier Pro",
      extensionDescription: "Notifica no celular quando o Claude liberar uso",
      actionDefaultTitle: "Claude Notifier Pro",
      popupDocumentTitle: "Claude Notifier Pro",
      popupEyebrow: "Monitoramento em segundo plano",
      popupHeading: "Claude Notifier",
      popupIntro: "Configure o identificador da organização e o tópico do ntfy para receber o aviso assim que o uso do Claude for liberado.",
      orgIdLabel: "Org ID do Claude",
      orgIdPlaceholder: "",
      orgIdHint: "Preencha esse campo com o ID capturado na URL de uso do Claude.",
      topicLabel: "Tópico do ntfy",
      topicPlaceholder: "claude-xyz123",
      topicHint: "Use um tópico exclusivo para evitar colisão com outras notificações.",
      languageLabel: "Idioma",
      languageHint: "Você pode seguir o idioma do navegador ou forçar um idioma específico para a interface e as notificações.",
      languageOptionAuto: "Automático (idioma do navegador)",
      languageOptionPtBr: "Português (Brasil)",
      languageOptionEn: "Inglês",
      languageOptionEs: "Espanhol",
      saveButtonIdle: "Salvar configuração",
      saveButtonBusy: "Salvando...",
      testButtonIdle: "Enviar teste",
      testButtonBusy: "Enviando...",
      checkStatusButtonIdle: "Verificar status do Claude",
      checkStatusButtonBusy: "Consultando...",
      popupInitialStatus: "Informe um tópico do ntfy e salve para ativar o alerta automático.",
      helpSummary: "Ajuda: como configurar a extensão",
      helpStep1Prefix: "Entre na página",
      helpStep2: "Inspecione o navegador e abra a aba de rede para acompanhar as requisições geradas.",
      helpStep3Prefix: "Clique no botão de atualizar da página de uso e localize o request para",
      helpStep4: "Recupere o ID usado na URL e insira esse valor no campo Org ID do Claude.",
      helpStep5: "Baixe o aplicativo ntfy e crie sua chave ou tópico.",
      helpStep6: "Adicione essa informação no campo Tópico do ntfy para receber as notificações.",
      helpNote: "Se o ID não aparecer de imediato, repita o clique em atualizar com o painel de rede aberto até capturar a requisição.",
      footerNote: "O aviso de liberação depende de uma sessão autenticada em claude.ai no navegador.",
      statusDefaultMessage: "Não foi possível consultar o status do Claude.",
      statusSaveSuccess: "Configuração salva. O monitoramento continuará em segundo plano.",
      statusSaveSuccessWithoutTopic: "Configuração salva. Adicione um tópico do ntfy para ativar os alertas remotos.",
      statusTopicRequiredTest: "Digite um tópico antes de enviar o teste.",
      statusOrgIdRequired: "Digite o Org ID do Claude antes de consultar o status.",
      statusSendingTest: "Enviando notificação de teste para o ntfy...",
      testNotificationBody: "Teste de notificação do Claude!",
      testNotificationTitle: "Teste Claude",
      statusTestSuccess: "Notificação de teste enviada com sucesso.",
      statusTestFailure: "Falha ao enviar a notificação. Verifique o tópico e sua conexão.",
      statusChecking: "Consultando status atual do Claude...",
      statusCheckFailure: "Falha ao consultar o status do Claude. Tente novamente.",
      notificationTitleAvailable: "Claude liberado",
      notificationTitleBlocked: "Claude bloqueado",
      notificationTitleError: "Erro ao consultar Claude",
      statusAuth: "Sessão do Claude não encontrada. Abra o claude.ai e faça login no navegador.",
      statusUnavailable: "Não foi possível consultar o status agora. Tente novamente em instantes.",
      statusUnexpectedResponse: "Resposta inesperada da API do Claude ao consultar o uso.",
      statusBlockedMessage: "Claude bloqueado no momento. Libera em aproximadamente $1.",
      statusAvailableMessage: "Claude liberado agora. Uso atual: $1% do limite de 5 horas.",
      statusSevenDayWithReset: "Limite semanal: $1%. Libera em $2.",
      statusSevenDayUsage: "Uso semanal: $1%.",
      statusUnlockNotification: "Claude liberado!",
      notificationSenderTitle: "Claude Notifier",
      localNotificationFailureTitle: "Falha ao enviar ntfy",
      localNotificationFailureMessage: "Não foi possível enviar a notificação remota.",
      donationPixQrAlt: "QR Code do Pix para $1",
      donationLinkAriaLabel: "Abrir apoio via $1 em uma nova aba",
      opensInNewTabSuffix: " (abre em nova aba)",
      detailLocalNotificationFailedRemoteSent: "ntfy enviado, mas a notificação local não foi exibida: $1",
      detailLocalNotificationFailedOnlyLocal: "Não foi possível exibir a notificação local: $1",
      statusNotifyFailureWithError: "O status foi consultado, mas houve falha ao enviar a notificação: $1",
      statusUnexpectedCheckFailure: "Falha inesperada ao consultar o status do Claude.",
      statusErrorNotificationFailure: "Houve falha na consulta e também não foi possível enviar a notificação de erro.",
      unknownError: "erro desconhecido"
    }),
    en: Object.freeze({
      extensionName: "Claude Notifier Pro",
      extensionDescription: "Sends a phone notification when Claude usage is available again",
      actionDefaultTitle: "Claude Notifier Pro",
      popupDocumentTitle: "Claude Notifier Pro",
      popupEyebrow: "Background monitoring",
      popupHeading: "Claude Notifier",
      popupIntro: "Configure the organization identifier and ntfy topic to receive an alert as soon as Claude usage is available again.",
      orgIdLabel: "Claude Org ID",
      orgIdPlaceholder: "",
      orgIdHint: "Fill in this field with the ID captured from Claude's usage URL.",
      topicLabel: "ntfy topic",
      topicPlaceholder: "claude-xyz123",
      topicHint: "Use a dedicated topic to avoid collisions with other notifications.",
      languageLabel: "Language",
      languageHint: "You can follow the browser language or force a specific language for the interface and notifications.",
      languageOptionAuto: "Automatic (browser language)",
      languageOptionPtBr: "Portuguese (Brazil)",
      languageOptionEn: "English",
      languageOptionEs: "Spanish",
      saveButtonIdle: "Save configuration",
      saveButtonBusy: "Saving...",
      testButtonIdle: "Send test",
      testButtonBusy: "Sending...",
      checkStatusButtonIdle: "Check Claude status",
      checkStatusButtonBusy: "Checking...",
      popupInitialStatus: "Enter an ntfy topic and save to enable automatic alerts.",
      helpSummary: "Help: how to configure the extension",
      helpStep1Prefix: "Open the page",
      helpStep2: "Inspect the browser and open the network tab to monitor the generated requests.",
      helpStep3Prefix: "Click the refresh button on the usage page and find the request to",
      helpStep4: "Copy the ID used in the URL and paste it into the Claude Org ID field.",
      helpStep5: "Install the ntfy app and create your key or topic.",
      helpStep6: "Add that information to the ntfy topic field to receive notifications.",
      helpNote: "If the ID does not appear immediately, click refresh again with the network panel open until the request is captured.",
      footerNote: "Unlock alerts depend on an authenticated claude.ai session in the browser.",
      statusDefaultMessage: "Unable to check Claude status.",
      statusSaveSuccess: "Configuration saved. Monitoring will continue in the background.",
      statusSaveSuccessWithoutTopic: "Configuration saved. Add an ntfy topic to enable remote alerts.",
      statusTopicRequiredTest: "Enter a topic before sending the test notification.",
      statusOrgIdRequired: "Enter the Claude Org ID before checking the status.",
      statusSendingTest: "Sending test notification to ntfy...",
      testNotificationBody: "Claude notification test!",
      testNotificationTitle: "Claude Test",
      statusTestSuccess: "Test notification sent successfully.",
      statusTestFailure: "Failed to send notification. Check the topic and your connection.",
      statusChecking: "Checking Claude status...",
      statusCheckFailure: "Failed to check Claude status. Try again.",
      notificationTitleAvailable: "Claude available",
      notificationTitleBlocked: "Claude blocked",
      notificationTitleError: "Error checking Claude",
      statusAuth: "Claude session not found. Open claude.ai and sign in with this browser.",
      statusUnavailable: "Unable to check the status right now. Try again shortly.",
      statusUnexpectedResponse: "Unexpected Claude API response while checking usage.",
      statusBlockedMessage: "Claude is currently blocked. It should be available in about $1.",
      statusAvailableMessage: "Claude is available now. Current usage: $1% of the 5-hour limit.",
      statusSevenDayWithReset: "Weekly limit: $1%. Resets on $2.",
      statusSevenDayUsage: "Weekly usage: $1%.",
      statusUnlockNotification: "Claude is available again!",
      notificationSenderTitle: "Claude Notifier",
      localNotificationFailureTitle: "Failed to send ntfy",
      localNotificationFailureMessage: "Unable to send the remote notification.",
      donationPixQrAlt: "QR code for $1",
      donationLinkAriaLabel: "Open support via $1 in a new tab",
      opensInNewTabSuffix: " (opens in a new tab)",
      detailLocalNotificationFailedRemoteSent: "ntfy was sent, but the local notification was not shown: $1",
      detailLocalNotificationFailedOnlyLocal: "Unable to show the local notification: $1",
      statusNotifyFailureWithError: "The status check succeeded, but sending the notification failed: $1",
      statusUnexpectedCheckFailure: "Unexpected failure while checking Claude status.",
      statusErrorNotificationFailure: "The status check failed and the error notification could not be sent either.",
      unknownError: "unknown error"
    }),
    es: Object.freeze({
      extensionName: "Claude Notifier Pro",
      extensionDescription: "Envía una notificación al móvil cuando Claude vuelve a estar disponible",
      actionDefaultTitle: "Claude Notifier Pro",
      popupDocumentTitle: "Claude Notifier Pro",
      popupEyebrow: "Monitoreo en segundo plano",
      popupHeading: "Claude Notifier",
      popupIntro: "Configura el identificador de la organización y el tema de ntfy para recibir una alerta en cuanto Claude vuelva a estar disponible.",
      orgIdLabel: "Org ID de Claude",
      orgIdPlaceholder: "",
      orgIdHint: "Completa este campo con el ID capturado en la URL de uso de Claude.",
      topicLabel: "Tema de ntfy",
      topicPlaceholder: "claude-xyz123",
      topicHint: "Usa un tema exclusivo para evitar conflictos con otras notificaciones.",
      languageLabel: "Idioma",
      languageHint: "Puedes seguir el idioma del navegador o forzar uno específico para la interfaz y las notificaciones.",
      languageOptionAuto: "Automático (idioma del navegador)",
      languageOptionPtBr: "Portugués (Brasil)",
      languageOptionEn: "Inglés",
      languageOptionEs: "Español",
      saveButtonIdle: "Guardar configuración",
      saveButtonBusy: "Guardando...",
      testButtonIdle: "Enviar prueba",
      testButtonBusy: "Enviando...",
      checkStatusButtonIdle: "Comprobar estado de Claude",
      checkStatusButtonBusy: "Consultando...",
      popupInitialStatus: "Indica un tema de ntfy y guarda para activar las alertas automáticas.",
      helpSummary: "Ayuda: cómo configurar la extensión",
      helpStep1Prefix: "Abre la página",
      helpStep2: "Inspecciona el navegador y abre la pestaña de red para seguir las solicitudes generadas.",
      helpStep3Prefix: "Haz clic en el botón de actualizar de la página de uso y localiza la solicitud a",
      helpStep4: "Copia el ID usado en la URL y pégalo en el campo Org ID de Claude.",
      helpStep5: "Instala la aplicación ntfy y crea tu clave o tema.",
      helpStep6: "Añade esa información en el campo Tema de ntfy para recibir las notificaciones.",
      helpNote: "Si el ID no aparece enseguida, vuelve a pulsar actualizar con el panel de red abierto hasta capturar la solicitud.",
      footerNote: "La alerta de liberación depende de una sesión autenticada en claude.ai dentro del navegador.",
      statusDefaultMessage: "No se pudo consultar el estado de Claude.",
      statusSaveSuccess: "Configuración guardada. El monitoreo seguirá activo en segundo plano.",
      statusSaveSuccessWithoutTopic: "Configuración guardada. Añade un tema de ntfy para activar las alertas remotas.",
      statusTopicRequiredTest: "Introduce un tema antes de enviar la prueba.",
      statusOrgIdRequired: "Introduce el Org ID de Claude antes de consultar el estado.",
      statusSendingTest: "Enviando notificación de prueba a ntfy...",
      testNotificationBody: "¡Prueba de notificación de Claude!",
      testNotificationTitle: "Prueba Claude",
      statusTestSuccess: "Notificación de prueba enviada correctamente.",
      statusTestFailure: "No se pudo enviar la notificación. Revisa el tema y tu conexión.",
      statusChecking: "Consultando el estado actual de Claude...",
      statusCheckFailure: "No se pudo consultar el estado de Claude. Inténtalo de nuevo.",
      notificationTitleAvailable: "Claude disponible",
      notificationTitleBlocked: "Claude bloqueado",
      notificationTitleError: "Error al consultar Claude",
      statusAuth: "No se encontró la sesión de Claude. Abre claude.ai e inicia sesión en este navegador.",
      statusUnavailable: "No fue posible consultar el estado ahora mismo. Inténtalo de nuevo en unos instantes.",
      statusUnexpectedResponse: "La API de Claude devolvió una respuesta inesperada al consultar el uso.",
      statusBlockedMessage: "Claude está bloqueado en este momento. Se liberará aproximadamente en $1.",
      statusAvailableMessage: "Claude ya está disponible. Uso actual: $1% del límite de 5 horas.",
      statusSevenDayWithReset: "Límite semanal: $1%. Se libera el $2.",
      statusSevenDayUsage: "Uso semanal: $1%.",
      statusUnlockNotification: "¡Claude volvió a estar disponible!",
      notificationSenderTitle: "Claude Notifier",
      localNotificationFailureTitle: "Error al enviar ntfy",
      localNotificationFailureMessage: "No fue posible enviar la notificación remota.",
      donationPixQrAlt: "Código QR de Pix para $1",
      donationLinkAriaLabel: "Abrir apoyo vía $1 en una nueva pestaña",
      opensInNewTabSuffix: " (se abre en una nueva pestaña)",
      detailLocalNotificationFailedRemoteSent: "ntfy se envió, pero la notificación local no se mostró: $1",
      detailLocalNotificationFailedOnlyLocal: "No fue posible mostrar la notificación local: $1",
      statusNotifyFailureWithError: "La consulta del estado se completó, pero falló el envío de la notificación: $1",
      statusUnexpectedCheckFailure: "Fallo inesperado al consultar el estado de Claude.",
      statusErrorNotificationFailure: "La consulta falló y tampoco se pudo enviar la notificación de error.",
      unknownError: "error desconocido"
    })
  });
  const FALLBACK_MESSAGES = LOCALE_CATALOGS[DEFAULT_LOCALE];
  let currentLanguageSetting = AUTO_LANGUAGE_VALUE;
  let currentLocale = DEFAULT_LOCALE;
  let initializationPromise;

  function normalizeSubstitutions(substitutions) {
    if (Array.isArray(substitutions)) {
      return substitutions;
    }

    if (substitutions === undefined || substitutions === null) {
      return [];
    }

    return [substitutions];
  }

  function formatFallbackMessage(message, substitutions) {
    return normalizeSubstitutions(substitutions).reduce((currentMessage, value, index) => {
      return currentMessage.replaceAll(`$${index + 1}`, String(value));
    }, message);
  }

  function normalizeLocale(locale) {
    const normalized = String(locale || "").trim().toLowerCase().replaceAll("_", "-");

    if (!normalized) {
      return DEFAULT_LOCALE;
    }

    if (normalized.startsWith("pt")) {
      return "pt-BR";
    }

    if (normalized.startsWith("en")) {
      return "en";
    }

    if (normalized.startsWith("es")) {
      return "es";
    }

    return DEFAULT_LOCALE;
  }

  function applyLocale(languageSetting) {
    currentLanguageSetting = languageSetting || AUTO_LANGUAGE_VALUE;
    currentLocale = currentLanguageSetting === AUTO_LANGUAGE_VALUE
      ? normalizeLocale(target.chrome?.i18n?.getUILanguage?.())
      : normalizeLocale(currentLanguageSetting);
  }

  function initializeI18n(forceRefresh = false) {
    if (!forceRefresh && initializationPromise) {
      return initializationPromise;
    }

    if (!target.chrome?.storage?.local?.get) {
      applyLocale(AUTO_LANGUAGE_VALUE);
      initializationPromise = Promise.resolve({
        language: currentLanguageSetting,
        locale: currentLocale
      });
      return initializationPromise;
    }

    initializationPromise = new Promise((resolve) => {
      target.chrome.storage.local.get([STORAGE_LANGUAGE_KEY], (data) => {
        applyLocale(data?.[STORAGE_LANGUAGE_KEY] || AUTO_LANGUAGE_VALUE);
        resolve({
          language: currentLanguageSetting,
          locale: currentLocale
        });
      });
    });

    return initializationPromise;
  }

  function setLanguagePreference(language, { persist = true } = {}) {
    applyLocale(language || AUTO_LANGUAGE_VALUE);

    if (!persist || !target.chrome?.storage?.local?.set) {
      return Promise.resolve({
        language: currentLanguageSetting,
        locale: currentLocale
      });
    }

    return new Promise((resolve) => {
      target.chrome.storage.local.set({ [STORAGE_LANGUAGE_KEY]: currentLanguageSetting }, () => {
        resolve({
          language: currentLanguageSetting,
          locale: currentLocale
        });
      });
    });
  }

  function getCurrentLanguageSetting() {
    return currentLanguageSetting;
  }

  function getCurrentLocale() {
    return currentLocale;
  }

  function getMessage(key, substitutions) {
    const catalog = LOCALE_CATALOGS[currentLocale] || FALLBACK_MESSAGES;
    const fallbackMessage = catalog[key] || FALLBACK_MESSAGES[key];

    if (!fallbackMessage) {
      return "";
    }

    return formatFallbackMessage(fallbackMessage, substitutions);
  }

  function localizeDocument(doc = target.document) {
    if (!doc?.querySelectorAll) {
      return;
    }

    if (doc.documentElement) {
      doc.documentElement.lang = currentLocale;
    }

    doc.querySelectorAll("[data-i18n]").forEach((element) => {
      const localizedText = getMessage(element.dataset.i18n);

      if (localizedText) {
        element.textContent = localizedText;
      }
    });

    doc.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const localizedText = getMessage(element.dataset.i18nPlaceholder);

      if (localizedText) {
        element.setAttribute("placeholder", localizedText);
      }
    });

    doc.querySelectorAll("[data-i18n-title]").forEach((element) => {
      const localizedText = getMessage(element.dataset.i18nTitle);

      if (localizedText) {
        element.setAttribute("title", localizedText);
      }
    });
  }

  target.__claudeNotifierI18n = {
    ...(target.__claudeNotifierI18n || {}),
    STORAGE_LANGUAGE_KEY,
    AUTO_LANGUAGE_VALUE,
    DEFAULT_LOCALE,
    LOCALE_CATALOGS,
    FALLBACK_MESSAGES,
    normalizeLocale,
    initializeI18n,
    setLanguagePreference,
    getCurrentLanguageSetting,
    getCurrentLocale,
    getMessage,
    localizeDocument
  };

  applyLocale(AUTO_LANGUAGE_VALUE);
})(globalThis);