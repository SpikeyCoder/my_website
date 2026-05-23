# booking-confirm — Stripe session verification (2026-05-23)

**Finding ID:** WA-2026-05-23-10
**Severity:** Medium
**Type:** Broken Access Control / Authentication Bypass by Spoofing
(OWASP A01, CWE-345)

## Background
`booking-confirm` accepted `body.stripeSessionId` from the client and
wrote it verbatim into `booking_events.stripe_session_id`. The token
ownership check (`tokenEmail === bodyEmail`) protected user-identity
spoofing, but the Stripe session id itself was never validated against
Stripe.

A holder of a valid booking token could submit any plausible
`cs_test_...` / `cs_live_...` id — including a competitor's real one
— and pollute the audit trail with false "paid via Stripe" rows.

## Fix
When `stripeSessionId` is present, the function now calls
`stripe.checkout.sessions.retrieve()` and rejects the request unless:
1. the Stripe session's customer email matches the authenticated
   token email; and
2. `payment_status` is `paid` (or `no_payment_required` for free
   bookings).

Bookings without `stripeSessionId` (the existing "manual_confirm" path)
are unaffected.

## Verification
- Confirm with no `stripeSessionId` → unchanged behaviour.
- Confirm with a real Stripe session for the token's email → 200.
- Confirm with another email's Stripe session → 403.
- Confirm with an unpaid session → 402.

Owner: @SpikeyCoder · Effort: M · Priority: P1
