---
title: Vendor & Subprocessor Inventory
tsc: CC9.1, CC9.2
owner: Kevin Armstrong
review-cadence: quarterly
last-reviewed: 2026-05-21
---

# Vendor & Subprocessor Inventory — kevinarmstrong.io

## Active Vendors

| Vendor | Service | Data Access | SOC 2 / ISO | Data Residency | DPA |
|--------|---------|-------------|-------------|----------------|-----|
| GitHub | Source control, CI/CD | Source code | SOC 2 Type II | US | Yes |
| Cloudflare | CDN, Pages hosting, Workers | Request logs, static assets | SOC 2 Type II, ISO 27001 | Global edge / US origin | Yes |
| Supabase | Blog posts database | Blog content (public) | SOC 2 Type II | US (AWS us-east-1) | Yes |
| GoatCounter | Privacy-friendly analytics | Page views (no PII) | N/A (open source) | EU | No PII processed |
| Mailgun | Transactional email alerts | Email addresses (admin only) | SOC 2 Type II | US | Yes |

## Assessment Criteria

Each vendor evaluated on: data access level, SOC 2/ISO certification, data residency, contractual protections (DPA/BAA), and breach notification SLA.

## Review Process

Reviewed quarterly. New vendors require security assessment before onboarding. Certification loss or breach triggers immediate review.

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-21 | Initial vendor inventory | Kevin Armstrong |
