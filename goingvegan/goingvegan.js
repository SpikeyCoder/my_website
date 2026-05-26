(() => {
  const IMPACT_PER_DAY = {
    animals: 1,
    water: 600,
    co2: 20,
    forest: 30
  };

  const numberFormatter = new Intl.NumberFormat("en-US");

  const daysRange = document.getElementById("gv-days");
  const daysNumber = document.getElementById("gv-days-number");
  const animalsEl = document.getElementById("gv-animals");
  const waterEl = document.getElementById("gv-water");
  const co2El = document.getElementById("gv-co2");
  const forestEl = document.getElementById("gv-forest");
  const shareButton = document.getElementById("gv-share-impact");
  const shareStatus = document.getElementById("gv-share-status");
  const faqTriggers = Array.from(document.querySelectorAll(".gv-faq-trigger"));

  const trackedScrollDepth = {
    50: false,
    90: false
  };

  function track(eventName, options = {}) {
    if (!window.siteAnalytics || typeof window.siteAnalytics.track !== "function") {
      return;
    }
    window.siteAnalytics.track(eventName, options);
  }

  function clampDays(value) {
    const numeric = Number.parseInt(String(value), 10);
    if (!Number.isFinite(numeric)) {
      return 1;
    }
    return Math.max(1, Math.min(3650, numeric));
  }

  function setImpact(days) {
    if (!animalsEl || !waterEl || !co2El || !forestEl) {
      return;
    }

    animalsEl.textContent = numberFormatter.format(Math.round(days * IMPACT_PER_DAY.animals));
    waterEl.textContent = numberFormatter.format(Math.round(days * IMPACT_PER_DAY.water));
    co2El.textContent = numberFormatter.format(Math.round(days * IMPACT_PER_DAY.co2));
    forestEl.textContent = numberFormatter.format(Math.round(days * IMPACT_PER_DAY.forest));
  }

  function syncDays(value, source) {
    const safeDays = clampDays(value);
    if (daysRange) {
      daysRange.value = String(safeDays);
    }
    if (daysNumber) {
      daysNumber.value = String(safeDays);
    }
    setImpact(safeDays);

    if (source) {
      track("impact_calculator_interaction", {
        title: `Impact calculator interaction (${source})`
      });
    }
  }

  async function copyToClipboard(text) {
    const payload = String(text || "").trim();
    if (!payload) {
      return false;
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(payload);
      return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = payload;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
    return copied;
  }

  function setShareStatus(message) {
    if (!shareStatus) {
      return;
    }

    shareStatus.textContent = message;
    if (!message) {
      return;
    }

    window.clearTimeout(Number(shareStatus.dataset.timeoutId || 0));
    const timeoutId = window.setTimeout(() => {
      shareStatus.textContent = "";
      delete shareStatus.dataset.timeoutId;
    }, 2200);

    shareStatus.dataset.timeoutId = String(timeoutId);
  }

  function buildImpactSummary() {
    const days = clampDays(daysNumber ? daysNumber.value : 30);
    const animals = Math.round(days * IMPACT_PER_DAY.animals);
    const water = Math.round(days * IMPACT_PER_DAY.water);
    const co2 = Math.round(days * IMPACT_PER_DAY.co2);

    return `In ${numberFormatter.format(days)} vegan days I estimate ${numberFormatter.format(animals)} animals helped, ${numberFormatter.format(water)} gallons of water saved, and ${numberFormatter.format(co2)} lbs CO2 reduced via GoingVegan: ${window.location.href}`;
  }

  async function shareImpact() {
    const summary = buildImpactSummary();
    track("impact_share_click", { title: "Impact share click" });

    if (navigator.share) {
      try {
        await navigator.share({
          title: "GoingVegan impact estimate",
          text: summary,
          url: window.location.href
        });
        setShareStatus("Shared");
        return;
      } catch (_error) {
        // Continue to clipboard fallback if share is canceled or not available.
      }
    }

    const copied = await copyToClipboard(summary);
    setShareStatus(copied ? "Copied!" : "Copy failed");
  }

  function setupFaq() {
    faqTriggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const panelId = trigger.getAttribute("aria-controls");
        if (!panelId) {
          return;
        }

        const panel = document.getElementById(panelId);
        if (!panel) {
          return;
        }

        const nextExpanded = trigger.getAttribute("aria-expanded") !== "true";
        trigger.setAttribute("aria-expanded", nextExpanded ? "true" : "false");
        panel.hidden = !nextExpanded;

        if (nextExpanded) {
          track("faq_expand", {
            title: trigger.textContent ? `FAQ expand: ${trigger.textContent.trim()}` : "FAQ expand"
          });
        }
      });
    });
  }

  function setupTrackedLinks() {
    const appStoreLinks = Array.from(document.querySelectorAll("a[href*='apps.apple.com/us/app/going-vegan-app']"));
    appStoreLinks.forEach((link) => {
      link.addEventListener("click", () => {
        track("app_store_click", {
          title: `App Store click: ${link.id || "goingvegan-cta"}`
        });
      });
    });

    const blogLinks = Array.from(document.querySelectorAll("[data-gv-blog-link]"));
    blogLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const headline = link.closest(".gv-blog-card")?.querySelector("h3")?.textContent?.trim();
        track("blog_post_click", {
          title: headline || "GoingVegan blog preview click"
        });
      });
    });
  }

  function setupScrollDepthTracking() {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const maxScrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const depth = (scrollTop / maxScrollable) * 100;

      if (!trackedScrollDepth[50] && depth >= 50) {
        trackedScrollDepth[50] = true;
        track("scroll_depth_50", { title: "Scroll depth 50%" });
      }

      if (!trackedScrollDepth[90] && depth >= 90) {
        trackedScrollDepth[90] = true;
        track("scroll_depth_90", { title: "Scroll depth 90%" });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
  }

  if (daysRange) {
    daysRange.addEventListener("input", (event) => {
      syncDays(event.target.value, "slider");
    });
  }

  if (daysNumber) {
    daysNumber.addEventListener("input", (event) => {
      syncDays(event.target.value, "input");
    });

    daysNumber.addEventListener("blur", () => {
      syncDays(daysNumber.value, null);
    });
  }

  if (shareButton) {
    shareButton.addEventListener("click", () => {
      shareImpact().catch(() => {
        setShareStatus("Copy failed");
      });
    });
  }

  syncDays(daysRange ? daysRange.value : 30, null);
  setupFaq();
  setupTrackedLinks();
  setupScrollDepthTracking();
})();
