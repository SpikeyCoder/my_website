(() => {
  const PROFILE_LINKS = {
    linkedin: "https://www.linkedin.com/company/112033735",
    x: "https://x.com/kevarmstech",
    github: "https://github.com/SpikeyCoder",
  };

  const COPY_FEEDBACK_MS = 1400;

  const SHARE_ENDPOINTS = {
    linkedin: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    x: (url) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`,
  };

  let activeShareRoot = null;

  function getFocusableMenuItems(menu) {
    return Array.from(menu.querySelectorAll("[role='menuitem']")).filter(
      (item) => !item.hasAttribute("disabled") && !item.getAttribute("aria-disabled")
    );
  }

  async function copyText(value) {
    const text = String(value || "").trim();
    if (!text) return false;

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const probe = document.createElement("textarea");
    probe.value = text;
    probe.setAttribute("readonly", "");
    probe.style.position = "fixed";
    probe.style.top = "-9999px";
    probe.style.opacity = "0";
    document.body.appendChild(probe);
    probe.focus();
    probe.select();

    let ok = false;
    try {
      ok = document.execCommand("copy");
    } finally {
      document.body.removeChild(probe);
    }

    return ok;
  }

  function showCopyFeedback(container, message = "Copied!") {
    if (!(container instanceof HTMLElement)) return;
    const feedback = container.querySelector("[data-copy-feedback]");
    if (!(feedback instanceof HTMLElement)) return;

    feedback.textContent = message;
    feedback.classList.add("is-visible");

    window.clearTimeout(Number(feedback.dataset.timeoutId || 0));
    const timeoutId = window.setTimeout(() => {
      feedback.textContent = "";
      feedback.classList.remove("is-visible");
      delete feedback.dataset.timeoutId;
    }, COPY_FEEDBACK_MS);
    feedback.dataset.timeoutId = String(timeoutId);
  }

  function closeShareMenu(root, restoreFocus = false) {
    if (!(root instanceof HTMLElement)) return;

    const trigger = root.querySelector("[data-share-trigger]");
    const menu = root.querySelector("[data-share-menu]");

    if (!(menu instanceof HTMLElement) || !(trigger instanceof HTMLButtonElement)) return;

    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    root.classList.remove("is-open");

    if (restoreFocus) {
      trigger.focus();
    }

    if (activeShareRoot === root) {
      activeShareRoot = null;
    }
  }

  function openShareMenu(root) {
    if (!(root instanceof HTMLElement)) return;

    const trigger = root.querySelector("[data-share-trigger]");
    const menu = root.querySelector("[data-share-menu]");

    if (!(menu instanceof HTMLElement) || !(trigger instanceof HTMLButtonElement)) return;

    if (activeShareRoot && activeShareRoot !== root) {
      closeShareMenu(activeShareRoot);
    }

    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    root.classList.add("is-open");
    activeShareRoot = root;

    const items = getFocusableMenuItems(menu);
    if (items.length) {
      items[0].focus();
    }
  }

  function setProfileLinks(root = document) {
    root.querySelectorAll("[data-social-profile]").forEach((el) => {
      if (!(el instanceof HTMLAnchorElement)) return;
      const key = String(el.dataset.socialProfile || "").toLowerCase();
      const href = PROFILE_LINKS[key];
      if (!href) return;
      el.href = href;
    });
  }

  function setupPageShareButtons(root = document) {
    root.querySelectorAll("[data-page-share]").forEach((el) => {
      if (!(el instanceof HTMLButtonElement)) return;
      if (el.dataset.shareInit === "1") return;
      el.dataset.shareInit = "1";

      el.addEventListener("click", async () => {
        const ok = await copyText(window.location.href);
        const feedbackScope = el.closest(".social-row") || el.parentElement;
        showCopyFeedback(feedbackScope, ok ? "Copied!" : "Copy failed");
      });
    });
  }

  function setupShareRoot(root) {
    if (!(root instanceof HTMLElement)) return;
    if (root.dataset.shareInit === "1") return;

    const trigger = root.querySelector("[data-share-trigger]");
    const menu = root.querySelector("[data-share-menu]");
    const closeButton = root.querySelector("[data-share-close]");
    const copyButton = root.querySelector("[data-share-copy]");

    if (!(trigger instanceof HTMLButtonElement) || !(menu instanceof HTMLElement)) return;

    const shareUrl = String(root.dataset.shareUrl || "").trim();
    if (shareUrl) {
      root.querySelectorAll("a[data-share-network]").forEach((link) => {
        if (!(link instanceof HTMLAnchorElement)) return;
        const key = String(link.dataset.shareNetwork || "").toLowerCase();
        const build = SHARE_ENDPOINTS[key];
        if (!build) return;
        link.href = build(shareUrl);
      });
    }

    root.dataset.shareInit = "1";
    menu.hidden = true;

    trigger.addEventListener("click", () => {
      if (menu.hidden) {
        openShareMenu(root);
      } else {
        closeShareMenu(root, true);
      }
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        openShareMenu(root);
      }
      if (event.key === "Escape") {
        closeShareMenu(root, true);
      }
    });

    if (closeButton instanceof HTMLButtonElement) {
      closeButton.addEventListener("click", () => {
        closeShareMenu(root, true);
      });
    }

    if (copyButton instanceof HTMLButtonElement) {
      copyButton.addEventListener("click", async () => {
        const ok = await copyText(shareUrl);
        showCopyFeedback(root, ok ? "Copied!" : "Copy failed");
        closeShareMenu(root, true);
      });
    }

    menu.addEventListener("keydown", (event) => {
      const items = getFocusableMenuItems(menu);
      if (!items.length) return;

      const index = items.indexOf(document.activeElement);
      if (event.key === "Escape") {
        event.preventDefault();
        closeShareMenu(root, true);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = (index + 1 + items.length) % items.length;
        items[next].focus();
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        const next = (index - 1 + items.length) % items.length;
        items[next].focus();
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        items[0].focus();
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        items[items.length - 1].focus();
      }
    });

    menu.querySelectorAll("a[role='menuitem']").forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      link.addEventListener("click", () => {
        closeShareMenu(root);
      });
    });

    root.addEventListener("focusout", () => {
      window.setTimeout(() => {
        if (activeShareRoot !== root) return;
        if (root.contains(document.activeElement)) return;
        closeShareMenu(root);
      }, 0);
    });
  }

  function setupShareMenus(root = document) {
    root.querySelectorAll("[data-share-root]").forEach((node) => {
      setupShareRoot(node);
    });
  }

  document.addEventListener("click", (event) => {
    if (!activeShareRoot) return;
    if (activeShareRoot.contains(event.target)) return;
    closeShareMenu(activeShareRoot);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!activeShareRoot) return;
    closeShareMenu(activeShareRoot, true);
  });

  function init(root = document) {
    setProfileLinks(root);
    setupPageShareButtons(root);
    setupShareMenus(root);
  }

  window.SocialShare = {
    PROFILE_LINKS,
    buildShareHref(network, targetUrl) {
      const key = String(network || "").toLowerCase();
      const build = SHARE_ENDPOINTS[key];
      return build ? build(targetUrl) : "";
    },
    init,
    setProfileLinks,
    setupPageShareButtons,
    setupShareMenus,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init(document));
  } else {
    init(document);
  }
})();
