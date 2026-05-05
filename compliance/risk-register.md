---
title: Risk Register
tsc: CC3
owner: Kevin Armstrong
review-cadence: quarterly
last-reviewed: 2026-05-05
---

# Risk Register — kevinarmstrong.io

| ID | Risk | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|---|
| R-01 | Supabase Edge Function compromise via leaked SERVICE_ROLE_KEY | Low | High | BOOKING_TOKEN_SECRET separated from SERVICE_ROLE; secret rotation runbook documented | Mitigated |
| R-02 | CDN compromise of jsdelivr injects JS into blog | Low | Medium | SRI pinning on all jsdelivr scripts (PR #18) | Mitigated |
| R-03 | Booking-flow CSRF | Low | Medium | SameSite=Lax cookie + token-bound confirm endpoint | Mitigated |
| R-04 | Booking token leak via XSS | Low | High | DOMPurify on rendered markdown; CSP enforced via Cloudflare Worker with sha256 hash list, no `'unsafe-inline'` in script-src (PRs #23/#24/#25/#26) | Mitigated |
| R-05 | Vendor lock-in on Supabase free tier | Medium | Low | DB schema migrations versioned; export script tested quarterly | Accepted |
| R-06 | Single owner — bus-factor of 1 | Medium | High | Encrypted credential vault (1Password) shared with successor designee | Partial |
| R-07 | `'unsafe-inline'` in `script-src` weakened defense-in-depth against future XSS | Low | Medium | Closed by PRs #23 (Worker-emitted CSP), #24 (externalised executable inline scripts), #25 (build-time sha256 hash list for data islands, refreshed daily by `.github/workflows/rss.yml`), #26 (flipped enforcement, removed `<meta>` tag) | Mitigated |
| R-08 | Third-party CORS proxies (`api.allorigins.win`, `r.jina.ai`) used as RSS fallbacks could MITM proxied feed content | Low | Low | Output of every proxied fetch is parsed as XML/HTML and re-escaped via `escapeHtml()` before being inserted into the DOM; no proxied content reaches a script context | Mitigated |

## 2026-05-05 attestations

**Initial review (2026-05-05, morning):** Risk register reviewed against the
pen-test performed on 2026-05-05. No new High or Critical risks identified.
R-07 and R-08 newly tracked.

**Post-remediation review (2026-05-05, post PR #26 merge):** R-04 and R-07
moved from *Partial* to *Mitigated* after the four-PR sequence below
shipped:

| PR | Effect |
|---|---|
| #23 | Cloudflare Worker emits `Content-Security-Policy-Report-Only` headers (staging) |
| #24 | Two executable inline `<script>` blocks (blog watchdog, RSS-list toggle) externalised; Worker report-only policy tightened to drop `'unsafe-inline'` |
| #25 | `scripts/compute_csp_hashes.py` + `_worker_csp_hashes.js` add build-time `sha256` allowance for the remaining inline data islands (org JSON-LD, RSS-seed island, ~80 per-post JSON-LD); refreshed daily by `.github/workflows/rss.yml` |
| #26 | Worker flipped from `Report-Only` to enforced; `<meta http-equiv>` tag removed from `index.html` and `404.html` |

After PR #26 the enforced `script-src` is `'self' https://cdn.jsdelivr.net
https://gc.zgo.at` plus the daily-regenerated sha256 hash list. No
`'unsafe-inline'` remains in `script-src`.

Style-src still permits `'unsafe-inline'` — deliberate for now; tracked
separately as a kevinarmstrong.io follow-up of the same shape as
WA-2026-05-05-02 on chaos_tester.
