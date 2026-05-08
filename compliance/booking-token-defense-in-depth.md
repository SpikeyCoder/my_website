---
title: Booking Token Storage — Defense in Depth
tsc: CC6, CC7
owner: Kevin Armstrong
review-cadence: annually
last-reviewed: 2026-05-08
relates-to: main.js, supabase/functions/_shared/booking.ts, supabase/functions/_shared/token.ts
---

# Booking token storage — defense in depth

## Summary

The booking flow (`/booking/...`, `setupBooking()` in `main.js`) issues a
short-lived, HMAC-signed token to track whether a visitor has paid via
Stripe Checkout. The token is delivered two ways:

1. As an **HttpOnly, Secure, SameSite=Lax cookie** named `bookingToken`
   (set by `supabase/functions/_shared/booking.ts → bookingTokenCookie`).
2. As a value in **`localStorage["bookingToken"]`** (set by
   `main.js → bookingIntake / fetchBookingStatus`).

The cookie is the primary credential when the browser is making a
same-domain request. The localStorage copy is a fallback used when the
flow is invoked cross-origin (e.g. from a draft of the site staged on
`*.workers.dev` or from a partner subdomain) where `Set-Cookie` is not
honoured by the browser without explicit `credentials: include` on
every fetch.

## Why this is documented

A naïve reading of the code might flag the localStorage copy as a token
leak surface (XSS in any blog post would be able to read it). This memo
records the threat model that was applied so the residual risk is
auditable:

- The token is **scoped only to the booking flow** — possessing it does
  not authenticate the bearer for any Supabase RLS policy, does not
  unlock admin endpoints, and does not authorize charges. It is
  effectively a "has-paid" hint that the server independently verifies
  on every read against the `booking_profiles` table.
- The token is **30-day TTL** (`BOOKING_TTL_SECONDS` in
  `supabase/functions/_shared/token.ts`).
- The Cloudflare Worker enforces a strict `script-src` (no
  `'unsafe-inline'`) with build-time-computed sha256 hashes for each
  inline data island (`_worker.js` + `_worker_csp_hashes.js`), so the
  XSS vector that would be required to read `localStorage` is itself
  contained by CSP.
- Markdown rendered in the live blog passes through `DOMPurify` with a
  tight tag/attr allowlist plus a `style` whitelist that only permits
  `color`, `font-size`, `font-family`, and `text-decoration: underline`
  (see `renderMarkdown` in `main.js`).

## Cleanup behaviour

When a user signs out of the admin panel (`auth-logout` button), the
booking token is **not** automatically removed from `localStorage` —
the cookie is, but the JS-readable copy persists until the next intake
call rotates it. This is intentional (the booking flow may continue
without an admin login) but is documented here so a future change can
revisit it if the threat model tightens.

## Future hardening (not blocking)

1. Drop the localStorage copy entirely once we no longer need the
   cross-origin fallback (i.e. once all booking traffic is served from
   `kevinarmstrong.io` or its `www.` apex).
2. Bind the token to a server-side session record so a stolen token
   from one device cannot be replayed from another (currently the token
   is stateless; binding to IP would break legitimate mobile-network
   roaming, so device fingerprint or per-device key is the better path).

## References

- AICPA TSC: **CC6.1** Logical access; **CC7.2** System monitoring.
- OWASP ASVS 4.0: V3.5 (Token-based session management).
- CWE-922: Insecure Storage of Sensitive Information.
