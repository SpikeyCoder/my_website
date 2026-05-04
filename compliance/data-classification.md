---
title: Data Classification Standard
tsc: C1, P1
owner: Kevin Armstrong
review-cadence: annually
last-reviewed: 2026-05-04
---

# Data Classification — kevinarmstrong.io

| Class | Definition | Examples | Storage allowed |
|---|---|---|---|
| **Public** | Already on the public web | Blog posts, RSS feed, og images | Any |
| **Internal** | Non-public but non-sensitive operational data | Build logs, run history | GitHub, Supabase, Cloudflare |
| **Confidential** | Customer PII, business email lists | Booking emails, calendar invites | Supabase only (encrypted at rest) |
| **Restricted** | Secrets, API keys, payment data | Stripe secret, BOOKING_TOKEN_SECRET, SERVICE_ROLE_KEY | Supabase Function Secrets / Cloudflare encrypted env only |

Restricted-class secrets are never committed to git; Dependabot and
GitHub secret-scanning alerts are reviewed weekly.
