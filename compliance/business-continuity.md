---
title: Business Continuity & Disaster Recovery
tsc: A, CC9
owner: Kevin Armstrong
review-cadence: annually
last-reviewed: 2026-05-04
---

# Business Continuity & DR — kevinarmstrong.io

## Recovery objectives

| System | RTO | RPO |
|---|---|---|
| Static site | 4 hours (rebuild from main) | 0 (git is source of truth) |
| Supabase Postgres (booking) | 24 hours (PITR restore) | 5 min (Supabase Pro PITR) |
| Stripe | n/a (Stripe is the system of record) | n/a |
| Cloudflare DNS | 1 hour (cutover to fallback registrar record) | n/a |

## Backup test cadence

- Supabase PITR restore is exercised every 6 months on a staging project;
  outcome filed under `compliance/postmortems/dr-test-YYYY-MM-DD.md`.

## Failure scenarios

| Scenario | Detection | Recovery |
|---|---|---|
| GitHub Pages outage | Cloudflare 5xx alert | Switch DNS to backup S3 mirror (planned) |
| Supabase outage | StatusGator alert | Booking flow shows graceful "try again later" banner; no data loss |
| Cloudflare outage | External monitor (UptimeRobot) | Direct GitHub Pages CNAME bypass via secondary DNS |
| Domain registrar lockout | Annual renewal calendar | Recovery email + MFA recovery codes in 1Password |

