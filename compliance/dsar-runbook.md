---
title: Data Subject Access Request (DSAR) Runbook
tsc: P5.1, P5.2, C1.2
owner: Kevin Armstrong
review-cadence: annually
last-reviewed: 2026-05-17
applies-to: kevinarmstrong.io (Armstrong HoldCo LLC)
finding-id: KA-2026-05-17-01
related: retention-and-deletion.md, data-classification.md, privacy/index.html
---

# Data Subject Access Request (DSAR) Runbook — kevinarmstrong.io

This runbook is the formal expansion of the one-line DSAR reference in
`compliance/retention-and-deletion.md`. It exists so an auditor can map
AICPA TSC **P5.1** ("the entity provides individuals with access to
their personal information for review and update") and **P5.2** ("the
entity communicates denial of access requests within the maximum
allowable time") to a single concrete artefact, and so the owner has a
step-by-step procedure that can be executed without re-deriving the
data model under time pressure.

The intake surface is intentionally simple — kevinarmstrong.io collects
very little personal data (booking email + a coaching-session
calendar invite + Stripe-side payment metadata for paid bookings) —
but a SOC 2 / GDPR-aware auditor still expects a documented flow.
This runbook brings parity with `funder-finder/compliance/dsar-runbook.md`.

## 1. Scope of personal data held

The list below is exhaustive for `kevinarmstrong.io` as of
`last-reviewed`. If a new collection point is added, the change-management
PR must update both this runbook and `compliance/data-classification.md`
in the same commit.

| Dataset | Storage | Identifier | Retention (per `retention-and-deletion.md`) |
|---|---|---|---|
| `booking_profiles` row | Supabase Postgres (`efrkjqbrfsynzdjbgqck` project, us-east-1) | `email_normalized` | While account active + 24 months |
| `booking_events` row | Supabase Postgres | `email_normalized` | 24 months |
| Google Calendar event (paid + free bookings) | Google Workspace (`kevinmarmstrong1990@gmail.com` calendar) | invitee email | Until manually deleted |
| Stripe customer record (paid bookings only) | Stripe (US) | `customer_id`, email, last-4 PAN | 7 years (tax) |
| Cloudflare access log line | Cloudflare (Global) | source IP | 30 days (CF default) |
| GoatCounter aggregate | GoatCounter (EU) | none — aggregate only, no per-visitor row | n/a |

Out of scope (no per-user data stored):

- The static site itself (GitHub Pages).
- GitHub commit history (the only "PII" is the repo owner's name).
- jsdelivr / Cloudflare CDN edges (no first-party data).

## 2. Intake

Data subjects email **kevinmarmstrong1990@gmail.com** with one of the
DSAR types listed below. The same address is published in
`SECURITY.md`, `/privacy/`, and `/.well-known/security.txt`.

| Request type | Synonyms | TSC | SLA |
|---|---|---|---|
| **Access** | "send me a copy of my data", "subject access request" | P5.1 | 30 days |
| **Correction** | "rectification", "fix my record" | P5.1 | 30 days |
| **Erasure** | "delete my data", "right to be forgotten" | P5.1 | 30 days |
| **Restriction** | "stop using my data" | P5.1 | 30 days |
| **Portability** | "give me my data in a portable format" | P5.1 | 30 days |
| **Objection** | "stop processing" | P5.1 | 30 days |

If the requester does not state the type explicitly, the owner replies
with the categories above and asks the requester to pick.

## 3. Identity verification

Identity is verified by replying to the same email address that the
booking_profile row was created under (the `email_normalized` column).
If the inbound DSAR email does not match a known booking email, the
owner asks the requester to provide a corroborating signal — typically
the date or time of the originally booked session — before any data
is shared.

This intentionally avoids requesting government ID for a service that
never collected it; GDPR Art. 12(6) allows "reasonable and proportionate"
verification.

## 4. Per-type procedure

### 4.1 Access (P5.1)

1. Query Supabase under the owner's `SUPABASE_SERVICE_ROLE_KEY`:
   ```sql
   select email_normalized, has_booked, source, created_at, updated_at
     from public.booking_profiles
    where email_normalized = $1;

   select event_type, source, metadata, created_at
     from public.booking_events
    where email_normalized = $1
    order by created_at desc;
   ```
2. Export the resulting rows to a `.json` file using `psql -A -F$'\t'`
   or the Supabase dashboard CSV export.
3. Check Google Calendar (`kevinmarmstrong1990@gmail.com`) for any
   future or past event with the requester as an invitee; include the
   event title, start time, and timezone in the export.
4. If the requester paid for a session, retrieve the Stripe
   `Customer` object from the Stripe dashboard (search by email);
   include the `customer_id` and `email` only — never the full PAN
   (Stripe stores only the last 4 of the PAN; share only that).
5. Reply to the requester with the data, in a single email or via
   a password-protected ZIP if the export exceeds 25 MB.

### 4.2 Correction (P5.1)

1. Verify the proposed correction against the inbound email
   (e.g., new email address must come from the new address as
   well, not only the old one — prevents takeover-by-DSAR).
2. `update public.booking_profiles set email_normalized = $new where
   email_normalized = $old;` — wrap in a transaction. If the new
   value collides with an existing row, ask the requester whether to
   merge.
3. Confirm to the requester within the SLA.

### 4.3 Erasure (P5.1) — the most common case

1. Delete the Supabase rows:
   ```sql
   begin;
   delete from public.booking_events    where email_normalized = $1;
   delete from public.booking_profiles  where email_normalized = $1;
   commit;
   ```
2. Cancel any future Google Calendar invite from
   `kevinmarmstrong1990@gmail.com` for that invitee; delete the past
   invites if requested.
3. Stripe: customer-record deletion is **deferred 7 years** for tax
   regulatory reasons (see `retention-and-deletion.md` row 5). Explain
   this exception to the requester explicitly; per GDPR Art. 17(3)(b)
   and (e), legal-obligation and legal-claims-defence are documented
   carve-outs. Offer to redact non-essential metadata on the Stripe
   record (delete `description`, custom metadata fields) so only the
   tax-required fields remain.
4. GoatCounter holds no per-visitor data, so no action is required;
   reply to the requester explaining the aggregate-only design.
5. Reply with the per-system attestation table:
   ```text
   Supabase booking_profiles : deleted YYYY-MM-DD
   Supabase booking_events   : deleted YYYY-MM-DD
   Google Calendar invites   : <cancelled / kept per request>
   Stripe customer record    : retained 7y for tax (legal obligation)
   GoatCounter               : no per-visitor data held
   Cloudflare access logs    : will roll off automatically (≤ 30d)
   ```

### 4.4 Restriction / objection / portability

- **Restriction:** flag the row by setting
  `source = 'dsar_restricted'` and add a comment explaining the
  restriction in the privacy log (`compliance/privacy-log.md`,
  created on first use). No outbound emails are sent to the
  restricted address until the restriction is lifted.
- **Objection:** equivalent to erasure for the purposes of this site
  (there is no marketing list).
- **Portability:** equivalent to access — the export already ships as
  `.json`.

## 5. Denial

A request may be denied if (a) the requester cannot be linked to any
stored data, (b) the request is manifestly unfounded or excessive
(GDPR Art. 12(5)), or (c) compliance would conflict with another
person's rights (e.g., a request to disclose a calendar event that
also reveals a third party's email).

Denials are communicated within the same 30-day SLA, include the
specific basis, and remind the requester of their right to lodge a
complaint with a supervisory authority. P5.2 requires the response
within the SLA even when the answer is "denied."

## 6. Logging

Every DSAR (request, response, action taken) is appended to
`compliance/privacy-log.md` (created on first DSAR). The log records:

- Date of intake.
- Anonymised requester reference (e.g., `dsar-2026-05-17-01`).
- Type (access / correction / erasure / etc.).
- Per-system actions taken (with the SQL or dashboard step).
- Date the response was sent.

The log is reviewed at every quarterly access-review (see
`compliance/access-review-cadence.md`).

## 7. Verification

The runbook is verified at the start of every annual SOC 2 readiness
review:

1. Walk the most recent DSAR end-to-end against this document; record
   any step that was performed differently and update the runbook in
   the same review PR.
2. Confirm that `SECURITY.md`, `/privacy/`, and
   `/.well-known/security.txt` all still publish the
   `kevinmarmstrong1990@gmail.com` intake address.
3. Confirm the per-dataset retention table in §1 matches
   `compliance/retention-and-deletion.md`.

Next scheduled verification: **2027-05-17** (annual cadence).

## 8. References

- AICPA Trust Services Criteria (2017, revised 2022) — P5.1, P5.2, C1.2.
- GDPR Arts. 12, 15–22 (data subject rights).
- CCPA §1798.100 et seq. (right to know, delete, opt-out).
- ISO/IEC 27701:2019 §7.3 (PII principals' rights).
- Companion runbook: `funder-finder/compliance/dsar-runbook.md`
  (sister site under the same legal entity, Armstrong HoldCo LLC).
