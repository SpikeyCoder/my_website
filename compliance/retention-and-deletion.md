---
title: Data Retention & Deletion Policy
tsc: C1, P4
owner: Kevin Armstrong
review-cadence: annually
last-reviewed: 2026-05-04
---

# Retention & Deletion — kevinarmstrong.io

| Dataset | Retention | Deletion mechanism |
|---|---|---|
| `booking_profiles` | While account active + 24 months after last booking | DSR webhook → SQL delete cascade |
| `booking_events` | 24 months | Scheduled Postgres job (planned) |
| Cloudflare access logs | 30 days (Cloudflare default) | Automatic |
| GoatCounter | Aggregate-only, no per-visitor data | n/a |
| Stripe customer records | 7 years (tax/regulatory) | Stripe Dashboard → Customer → Delete |
| GitHub commit history | Indefinite | Force-push removal only on accidental secret commits |

Data subject requests (access / correction / erasure) are handled by
emailing `kevinmarmstrong1990@gmail.com`; SLA is 30 days.
