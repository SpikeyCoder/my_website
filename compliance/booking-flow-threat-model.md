---
title: Booking flow threat model — kevinarmstrong.io
tsc: CC3.1, CC3.2, CC6.1, CC7.1
owner: Kevin Armstrong
review-cadence: annually
last-reviewed: 2026-05-14
relates-to: supabase/functions/booking-intake/, supabase/functions/booking-confirm/, supabase/functions/booking-status/, supabase/functions/_shared/token.ts
finding: KA-2026-05-14-01
---

# Booking flow threat model

## Scope

This document is the threat model SOC 2 CC3 expects: a written
analysis of the booking flow's assets, trust boundaries, threat
agents, attacks, and the controls that mitigate them. It complements
`compliance/booking-token-defense-in-depth.md` (which describes the
token-handling control in detail) and the per-finding pen-test
reports under the repo root.

## Assets

| Asset | Sensitivity | Location |
|---|---|---|
| Visitor email (post-intake) | Personal data (privacy: P1) | Supabase `booking_profiles` |
| Booking events log | Personal data (privacy: P1) | Supabase `booking_events` |
| Stripe paid-booking session | Financial — handled by Stripe Checkout, not stored locally | Stripe |
| `BOOKING_TOKEN_SECRET` | Secret | Supabase Function secrets only |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase Function secrets only |

## Trust boundaries

1. **Browser ↔ Cloudflare Worker** — TLS 1.2+; HSTS preload pending
   one max-age window of clean header data.
2. **Cloudflare Worker ↔ Supabase Edge Functions** — anon JWT for
   reads; HMAC-signed booking token for booking actions.
3. **Edge Function ↔ Supabase Postgres** — service-role JWT; all
   queries filter by the email derived from the verified booking
   token, never from the request body.
4. **Edge Function ↔ Stripe** — Stripe webhook signature verification
   (`stripe-webhook` function).
5. **Edge Function ↔ Google Calendar** — OAuth refresh-token flow;
   stored encrypted in Supabase.

## Threat agents

- **Unauthenticated internet attacker.** Most realistic threat;
  defended by the strict CSP, HSTS, the Worker recon-path block-list,
  HMAC-signed booking tokens, and Supabase RLS on the anon-key path.
- **Authenticated visitor.** Holds a booking token for their own
  email; cannot read or mutate another email's records because every
  query filters by the verified-token email.
- **Compromised dependency.** Mitigated by Dependabot + Supabase
  Edge runtime's pinned import map.
- **Insider with GitHub write access.** CODEOWNERS plus the
  `.github/workflows/rss.yml` deploy posture; secret rotation runbook
  in `compliance/incident-response.md`.

## Attacks and controls

| # | Attack | Control | TSC |
|---|---|---|---|
| 1 | XSS via blog content | Strict CSP (no `unsafe-inline`, sha256-hashed data islands), DOMPurify with tight tag/attr/style allowlist | CC6.1, CC7.1 |
| 2 | XSS via RSS link injection | URL parsed and protocol-checked (`http`/`https` only) before render; output escaped | CC7.1 |
| 3 | Clickjacking on booking flow | `X-Frame-Options: DENY` + `frame-ancestors 'none'` in CSP | CC6.1 |
| 4 | CSRF on booking POSTs | SameSite=Lax cookies + custom JSON content-type triggers CORS preflight against the allowlist | CC6.1 |
| 5 | Booking-token forgery | HMAC-SHA-256 with a dedicated `BOOKING_TOKEN_SECRET` (key-separated from `SUPABASE_SERVICE_ROLE_KEY`); 30-day expiry; cookie Max-Age tied to token TTL | CC6.1 |
| 6 | Booking-token replay after rotation | Secret rotation invalidates every issued token; runbook documents the customer-facing communication | CC7.1 |
| 7 | Recon (.env, /admin, /backup.sql, /graphql, /server-status, etc.) | Worker block-list at `_worker.js` returns 404 before the asset layer | CC7.1 |
| 8 | TLS strip | HSTS `max-age=63072000; includeSubDomains; preload` (preload submission pending one max-age window) | CC6.1 |
| 9 | Open redirect | All redirects are to constants (Stripe Checkout, Google Calendar) or relative same-origin paths | CC6.1 |
| 10 | PII over-collection | Only email is collected at intake; events log carries `user_agent` and nothing else from the request | C1.1, P3.1 |

## Residual risks accepted

- **Free-tier denial-of-service.** Cloudflare Pages and Supabase free
  tiers can be exhausted by sustained abusive traffic. Not in scope
  per `SECURITY.md`.
- **Self-XSS via devtools paste.** Out of scope; the strict CSP would
  block any inline script that did get pasted anyway.
- **DNS rebinding to internal IPs.** Not applicable — the site does
  not run a backend that visits user-supplied URLs.

## Review cadence

Annually, and after any of the following changes:
- New Edge Function added to `supabase/functions/`
- Migration that adds a column to a `booking_*` table
- Change to the CSP or HSTS posture
- Secret rotation event

## SOC 2 TSC mapping

- **CC3.1 — Identifying risks.** This document is the artefact.
- **CC3.2 — Risk analysis.** Attack table above.
- **CC6.1 — Logical access security.** Tokens, headers, CORS.
- **CC7.1 — System operations / vulnerability management.** Worker
  block-list, CSP, secret-rotation runbook reference.

## Change log

- 2026-05-14 — Initial version. Created to close the CC3 (risk
  assessment) gap flagged in the 2026-05-14 pen-test and SOC 2
  readiness review.
