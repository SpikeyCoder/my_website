// kevinarmstrong.io Cloudflare Worker
//
// Two responsibilities:
//   1. Block obvious recon paths (/.env, /admin, /backup.sql, etc.) — same as
//      the previous worker.
//   2. Wrap every successful response with a consistent set of security
//      headers, so they live in HTTP response headers (reportable) instead of
//      a per-page <meta> tag.
//
// The Content-Security-Policy migration is staged. Today the CSP is shipped as
// `Content-Security-Policy-Report-Only` so we can observe browser violation
// reports without breaking the site. The existing <meta http-equiv> tag in
// index.html remains the *enforced* policy. Once the inline-script-hash work
// (pen-test 2026-05-05 KA-2026-05-05-01) lands and we have a clean violation
// log for ~7 days, the next PR flips this header to `Content-Security-Policy`
// (enforced) and removes the <meta> tag.

const BLOCKED_PATHS = new Set([
  '/.env',
  '/.htpasswd',
  '/.htaccess',
  '/.ds_store',
  '/settings.py',
  '/config.php',
  '/phpinfo.php',
  '/info.php',
  '/server-status',
  '/server-info',
  '/debug',
  '/trace.axd',
  '/elmah.axd',
  '/thumbs.db',
  '/backup.sql',
  '/database.sql',
  '/dump.sql',
  '/admin',
  '/account',
  '/dashboard',
  '/billing',
  '/api/admin',
  '/api/private',
  '/api/users',
  '/api/settings',
  '/api/docs',
  '/config',
  '/internal',
  '/manage',
  '/orders',
  '/payments',
  '/profile',
  '/settings',
  '/users',
  '/swagger.json',
  '/openapi.json',
  '/graphql',
]);

const BLOCKED_PREFIXES = ['/.git/', '/.env.', '/debug/'];

function isBlocked(pathname) {
  const p = pathname.toLowerCase();
  if (BLOCKED_PATHS.has(p)) return true;
  for (const prefix of BLOCKED_PREFIXES) {
    if (p.startsWith(prefix)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------

// Single source of truth for the CSP. Mirrors the current <meta> policy in
// index.html so the report-only run is comparing apples to apples. When the
// inline-script-hash work (KA-2026-05-05-01) ships, replace 'unsafe-inline'
// in script-src with the build-time-computed sha256 list and drop the meta
// tag in the same PR.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://gc.zgo.at",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' " +
    "https://*.supabase.co " +
    "https://api.allorigins.win " +
    "https://r.jina.ai " +
    "https://gist.githubusercontent.com " +
    "https://gistcdn.githack.com " +
    "https://kevinarmstrong.goatcounter.com " +
    "https://gc.zgo.at",
  "frame-src 'self' https://www.loom.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://buy.stripe.com https://calendar.app.google https://*.supabase.co",
  "frame-ancestors 'none'",
].join('; ');

// Other security headers — flat object so headers can be merged into the
// upstream response in one pass without overwriting the asset's Content-Type
// or Cache-Control.
const SECURITY_HEADERS = {
  // 2 years, includeSubDomains, preload — closes WA-2026-05-05-04 equivalent
  // for kevinarmstrong.io. Submit to hstspreload.org once this has been live
  // for one full max-age window.
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  // Report-only for the staging window. Flip to 'Content-Security-Policy'
  // once KA-2026-05-05-01 ships and the <meta> tag is removed from
  // index.html.
  'Content-Security-Policy-Report-Only': CONTENT_SECURITY_POLICY,
};

// Only attach security headers to HTML / SVG document responses. Static
// assets (CSS, JS, images, fonts) inherit upstream caching headers and don't
// need CSP — and adding HSTS to a 304 / opaque response can confuse some
// clients.
function isHtmlResponse(response) {
  const ct = response.headers.get('content-type') || '';
  return (
    ct.includes('text/html') ||
    ct.includes('application/xhtml+xml') ||
    ct.includes('image/svg+xml') ||
    ct === ''
  );
}

function withSecurityHeaders(response) {
  // Always set HSTS — it's a domain-level signal, not document-specific.
  // CSP and document-only headers gate on isHtmlResponse() to avoid noise.
  const headers = new Headers(response.headers);
  headers.set(
    'Strict-Transport-Security',
    SECURITY_HEADERS['Strict-Transport-Security'],
  );
  headers.set('X-Content-Type-Options', SECURITY_HEADERS['X-Content-Type-Options']);

  if (isHtmlResponse(response)) {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(name, value);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// ---------------------------------------------------------------------------
// Worker entrypoint
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (isBlocked(url.pathname)) {
      return new Response('Not Found', { status: 404 });
    }

    const response = await env.ASSETS.fetch(request);

    if (response.status !== 404) {
      return withSecurityHeaders(response);
    }

    // SPA fallback for unknown paths — serve index.html with 200 status so
    // client-side routing can take over. Re-wrap with security headers so the
    // fallback page is treated identically to a direct hit.
    const indexResponse = await env.ASSETS.fetch(
      new Request(new URL('/', url.origin), request),
    );
    return withSecurityHeaders(
      new Response(indexResponse.body, {
        status: 200,
        headers: indexResponse.headers,
      }),
    );
  },
};
