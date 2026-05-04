---
title: Risk Register
tsc: CC3
owner: Kevin Armstrong
review-cadence: quarterly
last-reviewed: 2026-05-04
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
