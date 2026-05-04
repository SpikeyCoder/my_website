---
title: Vendor & Subprocessor Inventory
tsc: CC9
owner: Kevin Armstrong
review-cadence: quarterly
last-reviewed: 2026-05-04
---

# Vendor & Subprocessor Inventory — kevinarmstrong.io

| Vendor | Service | Data processed | Region | DPA on file | Notes |
|---|---|---|---|---|---|
| GitHub (Microsoft) | Source hosting + Actions + Pages | Source code, build artifacts | US | Yes (DPA-MBSA) | MFA enforced |
| Cloudflare | DNS + CDN + WAF | Request logs (IP, UA) | Global | Yes | Free plan |
| Supabase | Postgres + Auth + Edge Functions | Booking emails (PII) | us-east-1 | Yes | Pro plan |
| Stripe | Payments | Cardholder data, billing email | US | Yes | PCI handled by Stripe |
| GoatCounter | Privacy-friendly analytics | No cookies, no PII | EU | Yes | |
| jsdelivr | CDN for npm libraries | None (subresource) | Global | n/a | SRI-pinned per script |
| Google Calendar | Calendar event sync | Booking metadata | US | Yes (Google Workspace) | OAuth scoped |
| Loom | Embedded video | None (iframe) | US | Yes | |
| jina.ai | RSS reader fallback | RSS URLs only (public) | Global | n/a | Being phased out — see KA-2026-05-04-04 |
| allorigins.win | RSS reader fallback | RSS URLs only (public) | Global | n/a | Being phased out — see KA-2026-05-04-04 |

## Vendor change log

- 2026-05-04: initial inventory committed.
