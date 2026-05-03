# Security Policy

## Supported Versions

`kevinarmstrong.io` is a single-version static site. Only the current `main`
branch deployment is actively maintained.

## Reporting a Vulnerability

**Please do not file public GitHub issues for security vulnerabilities.**

Email **kevinmarmstrong1990@gmail.com** with:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- Any relevant logs, screenshots, or code references

You can expect an acknowledgement within **48 hours** and a resolution or
status update within **7 days**.

The same contact and disclosure timeline are mirrored in
[`/.well-known/security.txt`](https://kevinarmstrong.io/.well-known/security.txt)
in line with [RFC 9116](https://www.rfc-editor.org/rfc/rfc9116).

## Scope

In scope:

- Authentication or authorization issues in the Supabase-backed admin /
  blog flow (`index.html` `#admin-panel`)
- Cross-site scripting (XSS) in user-facing pages
- Data exposure or RLS bypass through the public Supabase REST API
- Issues in the public Supabase Edge Functions in `/supabase/functions/`
- Supply-chain issues in browser-loaded scripts (DOMPurify, marked,
  supabase-js — all currently SRI-pinned in `main.js#loadBlogDeps`)

Out of scope:

- Denial-of-service or volumetric attacks against free-tier infrastructure
- Self-XSS (requires the user to run code themselves)
- Issues requiring physical access to a device
- Findings in third-party services (Supabase, GoatCounter, Stripe, Google
  Calendar) that are properly the upstream vendor's responsibility
- Missing HTTP response headers attributable to the GitHub Pages host —
  this is a known limitation and we are working on host migration; see
  the comment in `index.html` near the meta CSP

## Architecture Notes for Researchers

- **Frontend**: Static HTML/JS hosted on GitHub Pages (no SSR)
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions) for the live
  blog, booking, Stripe, and Google Calendar integrations
- **Analytics**: GoatCounter (privacy-friendly, no cookies, no PII)
- The `SUPABASE_ANON_KEY` referenced in `main.js` is the public `anon` JWT
  and is intentionally exposed; database tables are protected by Supabase
  Row-Level Security
- All third-party browser libraries are loaded with Subresource Integrity
  hashes — see `loadBlogDeps()` in `main.js`

## Safe Harbor

We will not pursue legal action against researchers who:

- Make a good-faith effort to avoid privacy violations, destruction of
  data, and interruption or degradation of service
- Only interact with accounts they own or have explicit permission to
  access
- Give us reasonable time to investigate and address an issue before
  public disclosure (target: 90 days)
- Do not exfiltrate data beyond what is necessary to demonstrate the
  vulnerability
