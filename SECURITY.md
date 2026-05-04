# Security Policy

## Supported Versions

`kevinarmstrong.io` is a single-version static portfolio. Only the current
`main` branch deployment is actively maintained.

## Reporting a Vulnerability

**Please do not file public GitHub issues for security vulnerabilities.**

Email **kevinmarmstrong1990@gmail.com** with:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept (text only — do not attach
  exploit binaries)
- Any relevant logs, screenshots, or code references

You can expect an acknowledgement within **48 hours** and an initial
status update within **7 days**. Critical findings (RCE, auth bypass,
sensitive data exposure) will be triaged ahead of routine work.

A machine-readable equivalent of this policy is published at
[`/.well-known/security.txt`](.well-known/security.txt).

## Scope

In scope:

- Authentication or authorization bypass on the booking flow
- Cross-site scripting (XSS) anywhere on `kevinarmstrong.io`
- Server-side issues in Supabase Edge Functions in `/supabase/functions/`
- Supply-chain issues in pinned third-party dependencies (npm, pip,
  cdn.jsdelivr.net subresources)

Out of scope:

- Denial-of-service against free-tier hosting
- Self-XSS that requires a user to paste code into devtools
- Issues that require physical access to a device
- Rate-limiting on public APIs that have their own abuse protection

## Architecture Notes for Researchers

- **Frontend**: static HTML/JS, deployed via GitHub Pages → Cloudflare.
- **Backend**: Supabase (Auth, Postgres, Edge Functions) for the booking
  flow; Stripe Checkout for paid bookings.
- **Analytics**: GoatCounter (privacy-friendly, no cookies, no PII).
- The Supabase publishable / anon key in client code is **intentionally
  public** — it encodes the `anon` role and is protected by RLS.
- The `SUPABASE_SERVICE_ROLE_KEY`, `BOOKING_TOKEN_SECRET`, and Stripe
  secret are stored only as Supabase Function secrets and never reach
  the browser.

## Safe Harbor

Armstrong HoldCo LLC will not pursue legal action against researchers
who:

- Make a good-faith effort to comply with this policy
- Avoid privacy violations, denial-of-service, and destructive testing
- Give a reasonable disclosure window before going public

Thank you for helping keep `kevinarmstrong.io` and Armstrong HoldCo LLC
customers safe.
