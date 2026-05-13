# Cross-Origin-Embedder-Policy rollout — 2026-05-13

## Background

Pen-test 2026-05-13 finding **KA-2026-05-13-02**: the Cloudflare Worker
sets `Cross-Origin-Opener-Policy: same-origin` on HTML document responses
but does not set a complementary `Cross-Origin-Embedder-Policy` header.
Without COEP, the document does not enter a cross-origin isolated
agent cluster, which:

* Leaves shared-memory features (`SharedArrayBuffer`,
  `performance.measureUserAgentSpecificMemory()`) usable without the
  Spectre-mitigation guardrails browsers tie to isolation.
* Lets cross-origin subresources be loaded without the requesting
  document advertising what it expects (no CORP / CORS contract).

## Decision

Set `Cross-Origin-Embedder-Policy: credentialless` on HTML document
responses. This places the document into a cross-origin isolated
context (in combination with the existing COOP header) while stripping
ambient credentials from cross-origin fetches that do not return a
CORP header.

We deliberately do **not** ship `require-corp` today: the only
cross-origin subresource on the live site is the GoatCounter analytics
beacon (`gc.zgo.at`), which does not currently emit a
`Cross-Origin-Resource-Policy` header. Under `require-corp` that
fetch would be blocked outright; under `credentialless` the fetch
proceeds without cookies, which is the desired posture for a
no-cookie analytics endpoint anyway.

## Verification

1. Deploy to Cloudflare Pages.
2. From a logged-out incognito browser, load
   `https://kevinarmstrong.io/` and check:
   * `Cross-Origin-Embedder-Policy: credentialless` is present on
     the HTML response.
   * `Cross-Origin-Opener-Policy: same-origin` is unchanged.
   * The site renders without console errors.
3. From DevTools console: `crossOriginIsolated === true`.

## Tightening to `require-corp`

When/if we move analytics off `gc.zgo.at` or GoatCounter starts
serving CORP, re-evaluate `require-corp`. Open a follow-up PR that
switches the value and verifies all cross-origin subresources still
load.

## Reference

* WHATWG HTML — Cross-Origin-Embedder-Policy
* MDN — `Cross-Origin-Embedder-Policy`
* web.dev — "Why you need cross-origin isolated" (Chrome team)
