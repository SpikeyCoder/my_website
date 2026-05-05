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
| R-04 | Booking token leak via XSS | Low | High | DOMPurify on rendered markdown; CSP with hash-pinned inline scripts (planned) | Partial |
| R-05 | Vendor lock-in on Supabase free tier | Medium | Low | DB schema migrations versioned; export script tested quarterly | Accepted |
| R-06 | Single owner — bus-factor of 1 | Medium | High | Encrypted credential vault (1Password) shared with successor designee | Partial |
| R-07 | `'unsafe-inline'` in `script-src` weakens defense-in-depth against future XSS in static HTML (RSS-seed JSON, blog-loading watchdog, RSS-list height controller) | Low | Medium | Inline scripts are author-controlled and reviewed; planned migration to per-page CSP hash list (sha256-...) tracked from pentest 2026-05-05 (finding KA-2026-05-05-01) | Partial |
| R-08 | Third-party CORS proxies (`api.allorigins.win`, `r.jina.ai`) used as RSS fallbacks could MITM proxied feed content | Low | Low | Output of every proxied fetch is parsed as XML/HTML and re-escaped via `escapeHtml()` before being inserted into the DOM; no proxied content reaches a script context | Mitigated |

## 2026-05-05 attestation

The risk register was reviewed and refreshed against the pen-test performed
on 2026-05-05 (Armstrong HoldCo internal pen-test report). No new High or
Critical risks were identified. R-04 remains *Partial* pending the
inline-script-hash migration tracked in R-07. R-07 and R-08 are newly tracked
from the 2026-05-05 review.
