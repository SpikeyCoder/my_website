# Terms + Conditional Booking Integration

## 1) Terms page markup/content
Implemented at:
- `/terms-and-conditions/index.html`

Contains the full Terms and Conditions text for Armstrong HoldCo LLC (verbatim from approved copy).

## 2) Routing details for `/terms-and-conditions`
This site is GitHub Pages static hosting, so routing is path-folder based:
- `/terms-and-conditions` -> `/terms-and-conditions/index.html`
- `/terms-and-conditions/` -> `/terms-and-conditions/index.html`

No server rewrite is required.

## 3) Terms link under booking button
Implemented in career booking panel in:
- `/index.html`

Link text and target:
- `see Terms and Conditions policy`
- `/terms-and-conditions/`

## 4) Returning-customer detection and link switching logic
Frontend implementation:
- `/main.js` (`setupBooking()`)

Core rules:
1. Read first-party cookie `hasBooked=true` (364-day expiry) for immediate render.
2. Capture/normalize email via booking intake form.
3. Call Supabase function `booking-intake` to get canonical status.
4. If `hasBooked=true`: show only paid Stripe link.
5. If missing/false: show only free consult Google Calendar link.
6. Store email + signed booking token in browser for subsequent checks.
7. Reconcile with canonical status via `booking-status` endpoint.

## 5) Stripe integration steps (Checkout flow)
Current paid CTA uses existing Stripe Payment Link:
- `https://buy.stripe.com/14A28j2RQ3YQ4a82d7ao800`

Stripe dashboard configuration required:
1. Configure after-payment redirect to:
   - `https://kevinarmstrong.io/booking/paid-success`
2. Optional cancel URL:
   - `https://kevinarmstrong.io/booking/cancel`
3. Add webhook endpoint:
   - `https://efrkjqbrfsynzdjbgqck.supabase.co/functions/v1/stripe-webhook`
4. Subscribe webhook events:
   - `checkout.session.completed`
   - `payment_intent.succeeded` (optional reconciliation)

If migrating from Payment Link to Checkout Sessions later:
- `success_url`: `https://kevinarmstrong.io/booking/paid-success?session_id={CHECKOUT_SESSION_ID}`
- `cancel_url`: `https://kevinarmstrong.io/booking/cancel`
- Use Stripe `price_id` from Dashboard for `line_items`.

## 6) Booking confirmation method + hasBooked storage
### Confirmation strategy
Implemented as webhook + return confirmation:
- Webhook records Stripe payment events server-side.
- User confirms completed calendar booking at `/booking/success/`.
- Confirmation endpoint writes canonical booking status.

### Storage
Canonical server-side:
- `public.booking_profiles`
  - `email_normalized`
  - `has_booked`
  - `first_booked_at`
  - `updated_at`
  - `source`

Audit trail:
- `public.booking_events`
  - `event_type`
  - `source`
  - `stripe_session_id`
  - `metadata`

Client-side state cookie:
- `hasBooked=true`
- `Max-Age=31449600` (364 days)
- `Path=/; SameSite=Lax; Secure` (on HTTPS)

Backend endpoints:
- `POST /functions/v1/booking-intake`
- `GET /functions/v1/booking-status`
- `POST /functions/v1/booking-confirm`
- `POST /functions/v1/stripe-webhook`

Supabase files added:
- `supabase/migrations/20260226_booking_tables.sql`
- `supabase/functions/booking-intake/index.ts`
- `supabase/functions/booking-status/index.ts`
- `supabase/functions/booking-confirm/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
