---
title: Permissions-Policy expansion (2026-05-21)
tsc: CC6.1, CC7.1
owner: Kevin Armstrong
last-reviewed: 2026-05-21
finding: KA-2026-05-21-01
relates-to: _worker.js
---

# Permissions-Policy expansion — 2026-05-21

## Context

The 2026-05-21 authorized pen-test (engagement-wide, all three sites) flagged
that the response-header `Permissions-Policy` denied only four legacy
features (`camera`, `microphone`, `geolocation`, `interest-cohort`). Modern
browser surfaces — Topics API (`browsing-topics`), Attribution Reporting
(`attribution-reporting`), idle detection, WebUSB, WebSerial, Web
Bluetooth, Payment Request, WebAuthn passkey assertion, Gamepad, WebXR —
were left at the browser default ("allow self / all").

Trust-Center scanners (Mozilla Observatory, SecurityHeaders.com,
OWASP Secure Headers Project) have shifted their baseline to expect an
explicit deny-list of every powerful feature a site does not use. This is
defense-in-depth: a future inline-script regression or compromised
third-party subresource cannot request these APIs without explicit policy
approval.

## Change

`_worker.js` now emits a deny-list covering 37 features. The directives that
remain enabled with `(self)` are the three the site actually uses:

- `fullscreen=(self)` — Loom video embed full-screen
- `picture-in-picture=(self)` — Loom video PiP
- `web-share=(self)` — Blog "Share post" sheet on mobile Safari/Chrome

Everything else is `()` (disallowed for every origin including self).

## Verification

After deploy:

```
curl -I https://kevinarmstrong.io/ | grep -i permissions-policy
```

should return the expanded header. Re-run the Mozilla Observatory scan and
confirm the Permissions-Policy item flips from "improve" to "pass".

## References

- OWASP Secure Headers Project — Permissions-Policy guidance
- W3C *Permissions Policy* spec
- MDN *Permissions-Policy* directives list
