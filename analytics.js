(() => {
  const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
  const queue = [];

  function ready() {
    return Boolean(window.goatcounter && typeof window.goatcounter.count === "function");
  }

  function track(name, opts = {}) {
    const path = String(name || "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9:_-]/g, "");
    if (!path) return;
    const payload = { path, title: opts.title || path, event: true };
    if (ready()) {
      window.goatcounter.count(payload);
    } else {
      queue.push(payload);
    }
  }

  // --- Unique-per-visitor gate (via localStorage) ------------------------
  function trackOncePerVisitor(key, name, opts) {
    try {
      if (window.localStorage.getItem("analytics_once:" + key)) return;
      window.localStorage.setItem("analytics_once:" + key, String(Date.now()));
    } catch (_) {
      /* private mode / quota — fall through and just count anyway */
    }
    track(name, opts);
  }

  // --- GoatCounter loader ------------------------------------------------
  window.goatcounter = window.goatcounter || {};
  if (LOCAL_HOSTS.has(window.location.hostname)) {
    window.goatcounter.allow_local = true;
  }
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://gc.zgo.at/count.js";
  script.dataset.goatcounter = "https://kevinarmstrong.goatcounter.com/count";
  script.addEventListener("load", () => {
    if (!ready()) return;
    while (queue.length > 0) {
      window.goatcounter.count(queue.shift());
    }
  });
  document.head.appendChild(script);

  // --- Outbound link tracker (preserved from previous build) -------------
  document.addEventListener("click", (ev) => {
    const a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!isOutbound(a)) return;
    const url = new URL(a.href, window.location.href);
    track("outbound_click:" + url.hostname.replace(/\./g, "_"), {
      title: "Outbound click: " + url.hostname,
    });
    const sameTab = !a.target || a.target === "_self";
    const modifier =
      ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0;
    if (sameTab && !modifier) {
      ev.preventDefault();
      window.setTimeout(() => window.location.assign(url.href), 120);
    }
  });

  function isOutbound(a) {
    if (!(a instanceof HTMLAnchorElement)) return false;
    if (a.dataset.analyticsIgnore === "true") return false;
    if (!a.href) return false;
    let url;
    try {
      url = new URL(a.href, window.location.href);
    } catch (_) {
      return false;
    }
    if (!/^https?:$/.test(url.protocol)) return false;
    return url.origin !== window.location.origin;
  }

  // --- NEW: Booking email button — count unique visitors who click it ---
  // The "booking email button" is the "Open booking page" CTA at
  // #career-booking-link, which only enables after a valid booking email
  // is entered. Each unique browser fires the event at most once thanks
  // to the localStorage gate above.
  document.addEventListener(
    "click",
    (ev) => {
      const target = ev.target;
      if (!target || !target.closest) return;

      const bookingBtn = target.closest("#career-booking-link");
      if (bookingBtn && !bookingBtn.classList.contains("is-disabled")) {
        trackOncePerVisitor(
          "booking_email_button_click",
          "booking_email_button_click",
          { title: "Booking email button click (unique visitor)" }
        );
      }
    },
    true
  );

  // --- NEW: Dwell time on kevinarmstrong.io ------------------------------
  // Measures how long the page was actually visible, then sends a bucketed
  // event when the user leaves. Only fires once per page load.
  let dwellSent = false;
  let visibleMs = 0;
  let lastVisibleStart =
    document.visibilityState === "visible" ? Date.now() : null;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      lastVisibleStart = Date.now();
    } else if (lastVisibleStart != null) {
      visibleMs += Date.now() - lastVisibleStart;
      lastVisibleStart = null;
    }
  });

  function bucketSeconds(secs) {
    if (secs < 5) return "0_5s";
    if (secs < 15) return "5_15s";
    if (secs < 30) return "15_30s";
    if (secs < 60) return "30_60s";
    if (secs < 180) return "1_3m";
    if (secs < 300) return "3_5m";
    if (secs < 600) return "5_10m";
    if (secs < 1800) return "10_30m";
    return "30m_plus";
  }

  function sendDwell() {
    if (dwellSent) return;
    if (lastVisibleStart != null) {
      visibleMs += Date.now() - lastVisibleStart;
      lastVisibleStart = null;
    }
    const secs = Math.round(visibleMs / 1000);
    if (secs <= 0) return;
    dwellSent = true;
    const bucket = bucketSeconds(secs);
    // Bucketed event — easy to aggregate / chart in GoatCounter UI.
    track("dwell_time:" + bucket, {
      title: "Dwell time on " + window.location.pathname + " (" + bucket + ")",
    });
    // Exact-seconds event — enables true average dwell time when summed.
    track("dwell_seconds:" + secs, {
      title: "Exact dwell time in seconds: " + secs,
    });
  }

  window.addEventListener("pagehide", sendDwell);
  window.addEventListener("beforeunload", sendDwell);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendDwell();
  });

  // --- Public API --------------------------------------------------------
  window.siteAnalytics = { track, trackOncePerVisitor };
})();
