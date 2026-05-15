---
title: CSP Reporting Endpoint
tsc: CC4, CC7
owner: Kevin Armstrong
review-cadence: annually
last-reviewed: 2026-05-15
relates-to: _worker.js
---

# CSP Reporting Endpoint — kevinarmstrong.io

## Background

`_worker.js` enforces a strict Content-Security-Policy with no
`'unsafe-inline'` on `script-src`. Until 2026-05-15 the policy had no
telemetry attached: a CSP violation in production (e.g. a copy-paste
that re-introduces an inline event handler, a third-party script
fingerprint that no longer matches its sha256 hash after a silent CDN
republish, an XSS attempt blocked at the browser layer) caused the
browser to refuse the load, but no record reached the operator. The
control was therefore unobservable, which is a SOC 2 CC4.1 / CC7.1
monitoring-activities gap and a defense-in-depth weakness because
exploit attempts that the CSP successfully blocks would still go
unnoticed.

## Pen-test 2026-05-15 finding KA-2026-05-15-01

The Content-Security-Policy header carried no `report-uri` /
`report-to` directive, and no `Reporting-Endpoints` HTTP header was
set. The fix adds:

1. A `report-to csp-endpoint` directive (Reporting API, modern
   browsers).
2. A legacy `report-uri /api/csp-report` directive (Safari < 16.4,
   Firefox < 110, older Chromium).
3. A `Reporting-Endpoints: csp-endpoint="/api/csp-report"` header that
   names the same group.
4. A Worker route that accepts `POST /api/csp-report`, logs the
   payload as a single-line JSON entry to the Worker console, and
   returns `204 No Content`. The endpoint is method-locked to POST,
   accepts both `application/csp-report` and the newer
   `application/reports+json` content types, and truncates bodies
   above 64 KiB so a malformed UA cannot blow up a log line.

The endpoint is intentionally first-party and lives on the same
Cloudflare Worker as the rest of the site so a misbehaving extension or
a compromised CDN cannot also drop violation telemetry. Reports surface
in real time via `wrangler tail` and in batch via Cloudflare Logpush.

## Verification

1. Deploy this branch; load any page; check the response headers for
   `Reporting-Endpoints` and that `Content-Security-Policy` ends with
   `report-uri /api/csp-report; report-to csp-endpoint`.
2. Open DevTools → Network, force a violation by pasting a tiny
   inline script via the console (the page itself contains none),
   observe a `POST /api/csp-report` request with status `204` and a
   `application/csp-report` body.
3. Run `wrangler tail` against the production Worker and confirm the
   violation appears as a single-line JSON entry with
   `kind: "csp-report"`.
4. Confirm `GET /api/csp-report` returns `405 Method Not Allowed`
   (the path is intentionally not enumerable).

## References

- W3C — Content Security Policy Level 3 (`report-to`, `report-uri`)
- W3C — Reporting API (`Reporting-Endpoints` HTTP header)
- OWASP Secure Headers Project — CSP reporting guidance
- AICPA TSC **CC4.1** (Monitoring Activities) and **CC7.1** (System
  Operations — detection of anomalies)
- Pen-test 2026-05-15 finding **KA-2026-05-15-01**
