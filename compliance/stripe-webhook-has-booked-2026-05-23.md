# Stripe webhook now flips `has_booked = true` (2026-05-23)

**Finding ID:** WA-2026-05-23-09
**Severity:** Medium
**Type:** Insecure Design (OWASP A04, CWE-840 — Business Logic Errors)

## Background
On `checkout.session.completed`, the handler only inserted an empty
`booking_profiles` row when one didn't exist (`has_booked: false`),
and logged the event to `booking_events`. The browser-side
`booking-confirm` Edge Function was the only path that flipped
`has_booked = true` and stamped `first_booked_at`.

If the browser leg never fired (closed tab, ad-blocker, captive
portal, etc.), a paid customer remained marked as not booked.
Reconciliation, refund flows, and any downstream feature gates that
read `has_booked` would see the wrong source of truth.

## Fix
The webhook now treats a completed checkout session as the
authoritative paid-booking signal. It upserts `booking_profiles` with
`has_booked = true`, preserving any pre-existing `first_booked_at` so
that the *earliest* booking time wins on Stripe replay. The original
`booking_events.stripe.checkout.session.completed` row is still
written.

## Verification
- `stripe trigger checkout.session.completed`
- `select email_normalized, has_booked, first_booked_at, source
   from booking_profiles where email_normalized = '...'`
  → `has_booked = true`, `first_booked_at` populated, `source = 'stripe_webhook'`.
- Replay the same event: row should be unchanged (idempotent).

Owner: @SpikeyCoder · Effort: S · Priority: P1
