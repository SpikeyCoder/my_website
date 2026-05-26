---
title: Privacy Controls — kevinarmstrong.io
tsc: P1, P2, P3, P4, P5, P6, P7, P8
owner: Kevin Armstrong
review-cadence: annually
last-reviewed: 2026-05-20
---

# Privacy Controls (kevinarmstrong.io)

This document describes how kevinarmstrong.io implements the AICPA Trust
Services Criteria for **Privacy (P1–P8)**. It is the policy-level
counterpart to the public privacy notice at
[/privacy](https://kevinarmstrong.io/privacy) and the user-facing DSAR
process described in `compliance/dsar-runbook.md`.

## P1 — Notice and Communication of Privacy Commitments

- Public privacy notice at `/privacy` describes what is collected, how
  it is used, third-party processors, retention, and how to exercise
  DSAR rights.
- Notice is versioned via git (`privacy/index.html`); every material
  change is committed and the "Last updated" footer is bumped.
- Changes that materially expand processing trigger a banner on the
  homepage for 30 days.

## P2 — Choice and Consent

- The site uses **GoatCounter** for first-party, cookieless analytics
  — no consent banner is required because no PII, cross-site tracking,
  or identifiers are stored.
- The booking flow is opt-in: a visitor only submits identifiable
  data (name, email, message) by explicitly filling and submitting
  the form.
- No marketing emails, profiling, or automated decision-making are
  performed.

## P3 — Collection

- Minimum-necessary principle: the booking form collects only
  `name`, `email`, and `message`. No optional fields, no implicit
  collection.
- No third-party advertising pixels; the only outbound subresources
  are listed in the Worker CSP `connect-src` and `script-src`
  directives (`/_worker.js`) and are functional, not behavioural.

## P4 — Use, Retention, and Disposal

- Booking-flow submissions live in Supabase (`booking_requests` table)
  for **12 months**, then a pg_cron job marks them `purged=true` and
  redacts the `body` and `email` columns. See
  `compliance/retention-and-deletion.md`.
- GoatCounter retention follows the GoatCounter free-tier policy
  (rolling 6 months for aggregate hits; no per-visitor row).
- CSP-violation reports (`/api/csp-report`) are logged at the Worker
  level and ingested by Cloudflare Logpush; default Logpush retention
  is 30 days.

## P5 — Access (DSAR / Data Subject Rights)

- DSAR runbook: `compliance/dsar-runbook.md`. SLAs: 48-hour ACK,
  30-day fulfillment.
- DSAR intake address: kevinmarmstrong1990@gmail.com.

## P6 — Disclosure and Notification

- Third-party sub-processors are enumerated in
  `compliance/vendor-inventory.md` (Cloudflare, Supabase, GoatCounter,
  Stripe, Google Calendar API for booking).
- No data sales; no sharing with advertisers; no data brokers.
- In the event of a personal-data breach, notification follows the
  72-hour controller obligation in GDPR Art. 33 and the equivalent
  state-law notification windows (see `compliance/incident-response.md`).

## P7 — Quality

- Subjects may correct inaccurate personal data via the DSAR process
  (rectification right). No automated decision-making is performed,
  so quality concerns are limited to free-text booking-form fields.

## P8 — Monitoring and Enforcement

- Privacy controls are reviewed annually as part of the SOC 2
  readiness review.
- Any incident touching personal data triggers the incident-response
  runbook (`compliance/incident-response.md`) and a post-incident
  review.
- Vendor sub-processor changes require a vendor-inventory update and
  a refreshed risk-register entry.

## References

- AICPA Trust Services Criteria — Privacy (P1–P8)
- GDPR Articles 5, 6, 13–22, 33
- CCPA §1798.100–§1798.130

