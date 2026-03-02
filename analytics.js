(() => {
  const GOATCOUNTER_ENDPOINT = "https://kevinarmstrong.goatcounter.com/count";
  const GOATCOUNTER_SCRIPT = "https://gc.zgo.at/count.js";
  const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
  const pendingCounts = [];

  function hasCounter() {
    return Boolean(window.goatcounter && typeof window.goatcounter.count === "function");
  }

  function flushPendingCounts() {
    if (!hasCounter()) return;
    while (pendingCounts.length > 0) {
      const payload = pendingCounts.shift();
      window.goatcounter.count(payload);
    }
  }

  function sendCount(payload) {
    if (hasCounter()) {
      window.goatcounter.count(payload);
      return;
    }
    pendingCounts.push(payload);
  }

  function sanitizeEventName(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9:_-]/g, "");
  }

  function track(eventName, options = {}) {
    const safeName = sanitizeEventName(eventName);
    if (!safeName) return;
    sendCount({
      path: safeName,
      title: options.title || safeName,
      event: true,
    });
  }

  function isOutboundAnchor(anchor) {
    if (!(anchor instanceof HTMLAnchorElement)) return false;
    if (anchor.dataset.analyticsIgnore === "true") return false;
    if (!anchor.href) return false;

    let url;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch {
      return false;
    }

    if (!/^https?:$/.test(url.protocol)) return false;
    return url.origin !== window.location.origin;
  }

  window.goatcounter = window.goatcounter || {};
  if (LOCAL_HOSTS.has(window.location.hostname)) {
    window.goatcounter.allow_local = true;
  }

  const loader = document.createElement("script");
  loader.async = true;
  loader.src = GOATCOUNTER_SCRIPT;
  loader.dataset.goatcounter = GOATCOUNTER_ENDPOINT;
  loader.addEventListener("load", flushPendingCounts);
  document.head.appendChild(loader);

  document.addEventListener("click", (event) => {
    const anchor = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (!isOutboundAnchor(anchor)) return;

    const destination = new URL(anchor.href, window.location.href);
    const host = destination.hostname.replace(/\./g, "_");
    track(`outbound_click:${host}`, {
      title: `Outbound click: ${destination.hostname}`,
    });

    const sameTab = !anchor.target || anchor.target === "_self";
    const modifiedClick =
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0;

    if (sameTab && !modifiedClick) {
      event.preventDefault();
      window.setTimeout(() => {
        window.location.assign(anchor.href);
      }, 120);
    }
  });

  window.siteAnalytics = { track };
})();
