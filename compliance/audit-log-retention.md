# Audit Log Retention Policy — kevinarmstrong.io

**Owner:** Kevin Armstrong (kevinmarmstrong1990@gmail.com)
**Last reviewed:** 2026-05-11
**Review cadence:** Quarterly
**Applies to:** Armstrong HoldCo LLC / kevinarmstrong.io

## Purpose

This policy documents what audit and operational log data is collected
across the kevinarmstrong.io stack, how long it is retained, and how it
is reviewed. It exists to satisfy SOC 2 Trust Services Criterion **CC4
(Monitoring Activities)** and to give an audit trail in the event of a
security incident (see also `compliance/incident-response.md`).

## Log sources, retention, and access

| Source                    | What it records                              | Retention            | Access                               |
|---------------------------|----------------------------------------------|----------------------|--------------------------------------|
| Cloudflare Pages logs     | HTTP request metadata for static site        | 30 days (free tier)  | Cloudflare dashboard owner only      |
| Cloudflare Worker logs    | Worker invocations (`_worker.js`)            | 30 days              | Cloudflare dashboard owner only      |
| Supabase Auth logs        | Sign-in events, password resets, OTP issues  | 7 days (free tier)   | Supabase dashboard owner only        |
| Supabase Postgres logs    | Query errors, RLS denials                    | 7 days (free tier)   | Supabase dashboard owner only        |
| Supabase Edge Function logs | Booking, Stripe webhook, calendar setup    | 7 days (free tier)   | Supabase dashboard owner only        |
| Stripe Dashboard          | Payments, refunds, customer ops              | Indefinite (Stripe)  | Stripe owner only                    |
| GitHub audit log          | Repo access, branch protection changes      | 90 days (free tier)  | GitHub account owner                 |
| GoatCounter analytics     | Anonymised pageviews                         | Indefinite           | GoatCounter dashboard owner only     |

Retention here is bounded by the **most-restrictive** of the provider tier
limit and this policy. Where the provider retains data longer than
necessary (Stripe, GoatCounter), the policy does **not** lengthen the
retention — it only documents the practical floor.

## Long-term audit trail

For events that must be retained beyond the provider window (security
incidents, access reviews, configuration changes, vulnerability
disclosures), the canonical store is the relevant Markdown file in this
`compliance/` directory, which lives in git and is retained for the life
of the repository.

Specifically:

* **Access reviews** — `compliance/access-review-cadence.md` records the
  outcome of each quarterly review (who, what, when).
* **Security incidents** — `compliance/incident-response.md` plus a
  per-incident `SECURITY-INCIDENT-<date>.md` file at repo root once an
  incident is declared.
* **Vendor changes** — `compliance/vendor-inventory.md`.
* **Pen-test reports** — `Armstrong_HoldCo_Pentest_Report_<date>.docx` at
  repo root, retained indefinitely.

## Review cadence

Once per quarter the owner:

1. Checks that Cloudflare, Supabase, Stripe, and GitHub audit logs are
   still being produced (open each dashboard, confirm last-event recency).
2. Spot-checks one week of Supabase Auth logs for unexpected sign-in
   anomalies (failed-OTP bursts, sign-ins from new geo regions).
3. Confirms that Dependabot is opening PRs (security-related events show
   up in the repo's pull-request feed).
4. Records the review outcome in `compliance/access-review-cadence.md`.

## Incident retention extension

If a security incident is declared, all log sources are retrieved on a
**preserve-in-place** basis: the owner downloads the relevant log
ranges to encrypted local storage within 24 hours of declaration, since
the provider retention windows are short. The downloaded set is held for
the duration of the incident plus three years.

## References

* AICPA Trust Services Criteria 2017 (with 2022 revisions) — CC4.1, CC4.2
* NIST SP 800-53 Rev. 5 — AU-11 (Audit Record Retention)
* CIS Controls v8 — Control 8 (Audit Log Management)
