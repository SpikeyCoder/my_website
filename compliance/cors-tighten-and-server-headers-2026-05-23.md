# CORS tightening + fingerprinting-header removal (2026-05-23)

## WA-2026-05-23-07 — `spikeycoder.github.io` in production CORS allowlist (LOW)
**OWASP A05, CWE-942**

`supabase/functions/_shared/cors.ts` previously listed
`https://spikeycoder.github.io` in `PROD_ORIGINS`. Combined with
`Access-Control-Allow-Credentials: true`, any project page on the
personal github.io subdomain could call `booking-intake`, `booking-status`,
or `booking-confirm` with the user's cookie. If a stale GH-pages branch
were ever repurposed or hijacked it became a same-credentials attack
surface for stealing booking tokens.

**Fix:** moved `https://spikeycoder.github.io` from `PROD_ORIGINS` to
`DEV_ORIGINS`. Local preview parity is preserved; production deployments
(no `ENVIRONMENT=development` flag) no longer honour the origin.

## WA-2026-05-23-08 — fingerprinting headers passed through (INFO)
`_worker.js::withSecurityHeaders()` did not strip `Server` /
`X-Powered-By` from upstream responses. Added explicit
`headers.delete('Server')` and `headers.delete('X-Powered-By')` calls.

## Verification
- In a non-dev deployment:
  ```
  curl -s -H 'Origin: https://spikeycoder.github.io' -I \
       https://<project>.functions.supabase.co/booking-status
  ```
  must NOT contain `Access-Control-Allow-Origin`.
- `curl -sI https://kevinarmstrong.io/` must NOT contain `Server` or
  `X-Powered-By` headers (beyond what Cloudflare's network adds at the
  edge).

Owner: @SpikeyCoder · Effort: S · Priority: P1 / P2
