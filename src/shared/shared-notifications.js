(function installSharedNotifications(target) {
  const NTFY_BASE_URL = "https://ntfy.sh";
  const DEFAULT_HEADERS = Object.freeze({
    Priority: "urgent",
    "Content-Type": "text/plain; charset=UTF-8"
  });

  function buildNtfyRequest(topic, message, title) {
    return {
      url: `${NTFY_BASE_URL}/${topic}`,
      options: {
        method: "POST",
        body: message,
        headers: {
          ...DEFAULT_HEADERS,
          Title: title
        }
      }
    };
  }

  async function sendNtfyNotification(topic, message, title, fetchImplementation = target.fetch) {
    const { url, options } = buildNtfyRequest(topic, message, title);
    const response = await fetchImplementation(url, options);

    if (!response.ok) {
      throw new Error(`ntfy request failed with status ${response.status}`);
    }

    return response;
  }

  target.__claudeNotifierShared = {
    ...(target.__claudeNotifierShared || {}),
    NTFY_BASE_URL,
    DEFAULT_HEADERS,
    buildNtfyRequest,
    sendNtfyNotification
  };
})(globalThis);