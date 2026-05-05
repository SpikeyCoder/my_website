// Blog-loading watchdog
//
// Externalised from index.html (line ~625) by pen-test 2026-05-05 KA-01.
// Externalising this block lets the CSP drop 'unsafe-inline' from script-src
// without losing the loading-error UX. See compliance/risk-register.md R-04.
//
// Behaviour:
//   - If #blog-status text is still "Loading..." after 10 seconds, replace it
//     with a friendly retry hint.
//   - Once #blog-list has any children (the supabase fetch in main.js
//     populated it), clear the timeout and stop observing.
//
// Loaded with `defer` so it runs after parsing without blocking the page.

(function () {
  const blogStatus = document.getElementById("blog-status");
  const blogList = document.getElementById("blog-list");
  if (!blogStatus || !blogList) return;

  const ERROR_TEXT =
    "Blog posts unavailable right now. Please refresh to try again.";
  const TIMEOUT_MS = 10000;

  const timeoutId = setTimeout(() => {
    if (blogStatus.textContent === "Loading...") {
      blogStatus.textContent = ERROR_TEXT;
    }
  }, TIMEOUT_MS);

  const observer = new MutationObserver(() => {
    if (
      blogList.children.length > 0 &&
      blogStatus.textContent !== ERROR_TEXT
    ) {
      clearTimeout(timeoutId);
      observer.disconnect();
    }
  });
  observer.observe(blogList, { childList: true });

  // Expose the timeout id for any consumer (none today, but keeps parity
  // with the previous inline script's contract).
  window.__blogLoadingTimeout = timeoutId;
})();
