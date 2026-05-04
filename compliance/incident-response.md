---
title: Incident Response Runbook
tsc: CC4, CC7
owner: Kevin Armstrong
review-cadence: annually
last-reviewed: 2026-05-04
---

# Incident Response Runbook — kevinarmstrong.io

This runbook is the authoritative reference for handling a confirmed or
suspected security incident affecting `kevinarmstrong.io` or its supporting
infrastructure (Supabase project, Cloudflare zone, GitHub repository,
Stripe account, GoatCounter property).

## 1. Detection sources

- Supabase: Edge Function logs, Postgres logs, auth audit log
- Cloudflare: WAF events, security analytics
- Stripe: webhook delivery failures, dispute notifications
- GitHub: secret-scanning alerts, Dependabot security advisories
- External: emails to `kevinmarmstrong1990@gmail.com` (security.txt contact)

## 2. Severity matrix

| Sev | Definition | Response time |
|---|---|---|
| SEV-1 | Active customer-impacting outage, confirmed data exposure, or active exploitation | < 1 hour |
| SEV-2 | Confirmed vulnerability, no exploitation observed, or partial outage | < 24 hours |
| SEV-3 | Misconfiguration, low-risk vulnerability, or hygiene gap | < 7 days |

## 3. Roles

- **Incident Commander**: Kevin Armstrong (owner)
- **Comms lead**: Incident Commander (single-person org)
- **Tech lead**: Incident Commander or designated contractor

## 4. Workflow

1. **Acknowledge** the alert in writing within 1 hour for SEV-1, 24 hours
   for SEV-2.
2. **Triage** — confirm reproducibility, scope, and severity.
3. **Contain** — disable the vulnerable code path (Cloudflare WAF rule,
   Supabase RLS toggle, Stripe webhook pause).
4. **Eradicate** — ship a fix on a `security/*` branch, merge to main,
   redeploy.
5. **Recover** — verify production is healthy, restore any disabled
   features.
6. **Notify** — affected users (per privacy policy and applicable law),
   processors as required by their contracts.
7. **Postmortem** — within 7 days for SEV-1/2, document root cause,
   timeline, contributing factors, and corrective actions in
   `compliance/postmortems/YYYY-MM-DD-slug.md`.

## 5. Communications templates

See `compliance/templates/` (drafts to be added on first incident).

## 6. Tabletop cadence

A tabletop exercise is run **every 12 months** following an unscheduled
SEV-2 simulation; outputs filed under `compliance/postmortems/tabletop-YYYY-MM-DD.md`.
