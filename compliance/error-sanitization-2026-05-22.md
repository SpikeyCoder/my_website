---
title: Error-message sanitisation in Supabase Edge Functions
tsc: CC6.1, CC7.2
owner: Kevin Armstrong
review-cadence: annually
last-reviewed: 2026-05-22
applies-to: kevinarmstrong.io (SpikeyCoder/my_website)
finding-id: KA-2026-05-22-01
cwe: CWE-209
owasp: A09:2021 (Security Logging and Monitoring Failures), A04:2021 (Insecure Design)
---

# Error-message sanitisation in Edge Functions

## Why

Pen-test 2026-05-22 (finding **KA-2026-05-22-01**) flagged that every
booking and calendar Supabase Edge Function returned `error.message`
verbatim to the HTTP client on a 500 path. That covers:

- Raw Postgres error strings from the `supabase-js` client. These can
  include schema names (`booking_profiles`), constraint names
  (`booking_profiles_email_normalized_key`), column names, and
  occasional row values from `details:` / `hint:` fields.
- Raw `Error.message` from runtime exceptions, which can include file
  paths, stack-trace fragments, and Google Calendar API failure
  bodies that themselves describe internal endpoint structure.

Returning that detail to the network is **CWE-209** (Information
Exposure Through an Error Message) and helps an attacker map the
backing schema without authentication. The fix is to log the full
detail server-side (where Cloud Run / Supabase functions already
capture stderr) and return a fixed public-facing string to the
caller.

## What

Added `sanitiseError(err, fallback)` to
`supabase/functions/_shared/http.ts`. It:

1. Calls `console.error("[sanitised_error] …")` with the raw detail so
   the operator can still triage from the Function log.
2. Returns the fallback string (caller picks one of "Database
   operation failed", "Internal server error", or a domain-specific
   short label).

Replaced every `error: someError.message` and `error: error
instanceof Error ? error.message : "Unknown error"` site in:

- `supabase/functions/booking-intake/index.ts`
- `supabase/functions/booking-confirm/index.ts`
- `supabase/functions/booking-status/index.ts` (DB + Calendar sync paths)
- `supabase/functions/google-calendar-setup/index.ts`
- `supabase/functions/google-calendar-sync/index.ts`
- `supabase/functions/google-calendar-webhook/index.ts`
- `supabase/functions/stripe-webhook/index.ts` (signature verification + generic 500)

## Verification

After redeploy, induce a 500 (e.g. submit a duplicate booking that
violates a unique constraint) and confirm the response body matches
the generic fallback rather than echoing a Postgres error:

```
curl -X POST https://…/functions/v1/booking-confirm -d '…' -i
# expected body: {"error":"Database operation failed"}
# NOT: {"error":"duplicate key value violates unique constraint …"}
```

Then confirm the operator-facing detail is in the Function log:

```
supabase functions logs booking-confirm --tail
# expected line: [sanitised_error] PostgrestError: duplicate key value …
```

## References

- [CWE-209](https://cwe.mitre.org/data/definitions/209.html)
- [OWASP API3:2023 — Broken Object Property Level Authorization (related)](https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/)
- [OWASP A09:2021 — Security Logging and Monitoring Failures](https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/)
