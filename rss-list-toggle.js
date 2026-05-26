// RSS list toggle / height controller
//
// Externalised from index.html (line ~655) by pen-test 2026-05-05 KA-01.
// Externalising this block lets the CSP drop 'unsafe-inline' from script-src
// without losing the show-more / show-less behaviour for the RSS panel.
//
// Behaviour:
//   - The setupRSS() routine in main.js sets list.style.maxHeight to clamp
//     the RSS panel to ~5 items in the collapsed state. This script:
//     * watches for that maxHeight setting and remembers the collapsed value,
//     * shows the toggle row only when there are >5 items,
//     * on toggle click, expands by clearing maxHeight or re-applies the
//       remembered collapsed value.
//
// Loaded with `defer` so it runs after parsing without blocking the page.

(function () {
  const list = document.getElementById("rss-list");
  const toggleRow = document.getElementById("rss-toggle-row");
  const toggleBtn = document.getElementById("rss-toggle");
  if (!list || !toggleRow || !toggleBtn) return;

  let expanded = false;
  let collapsedHeight = null;

  // Intercept main.js setting maxHeight so we can restore it when expanding.
  const styleObs = new MutationObserver(() => {
    const mh = list.style.maxHeight;
    if (!expanded) {
      if (mh) collapsedHeight = mh;
      return;
    }
    // Expanded: main.js tried to cap the height — override it.
    if (mh) {
      styleObs.disconnect();
      list.style.maxHeight = "";
      styleObs.observe(list, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }
  });
  styleObs.observe(list, { attributes: true, attributeFilter: ["style"] });

  // Show / hide the toggle row based on item count.
  const contentObs = new MutationObserver(() => {
    const count = list.querySelectorAll(".rss-item").length;
    toggleRow.style.display = count > 5 ? "" : "none";
  });
  contentObs.observe(list, { childList: true });

  toggleBtn.addEventListener("click", () => {
    expanded = !expanded;
    if (expanded) {
      styleObs.disconnect();
      list.style.maxHeight = "";
      styleObs.observe(list, {
        attributes: true,
        attributeFilter: ["style"],
      });
      toggleBtn.textContent = "Show less";
    } else {
      styleObs.disconnect();
      if (collapsedHeight) list.style.maxHeight = collapsedHeight;
      styleObs.observe(list, {
        attributes: true,
        attributeFilter: ["style"],
      });
      toggleBtn.textContent = "Show more";
      list.scrollTop = 0;
    }
  });
})();
