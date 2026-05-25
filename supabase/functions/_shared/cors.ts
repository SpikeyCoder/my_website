// CORS allowlist for Supabase Edge Functions.
//
// Production origins are always allowed. Localhost dev origins are
// allow-listed only when ENVIRONMENT === "development" so they cannot be
// abused if production ever runs against a misconfigured Deno deployment
// or shared dev environment. Pen-test 2026-05-07 finding KA-2026-05-07-02.
// WA-2026-05-23-07: spikeycoder.github.io previously sat in the
// production allowlist. Combined with Access-Control-Allow-Credentials:
// true it meant any project page on the personal github.io subdomain
// could call booking-intake/status/confirm with the user's cookie. If a
// stale GH-pages branch is ever repurposed or hijacked it becomes a
// same-credentials attack surface for stealing booking tokens. Move to
// DEV_ORIGINS — github.io still works for local preview parity but is
// not honoured in production.
const PROD_ORIGINS = new Set([
  "https://kevinarmstrong.io",
  "https://www.kevinarmstrong.io",
]);

const DEV_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:5173",
  "https://spikeycoder.github.io",
]);

function isDev(): boolean {
  const env = (Deno.env.get("ENVIRONMENT") || "").toLowerCase();
  return env === "development" || env === "dev" || env === "local";
}

function allowedOrigins(): Set<string> {
  if (isDev()) {
    return new Set([...PROD_ORIGINS, ...DEV_ORIGINS]);
  }
  return PROD_ORIGINS;
}

export function resolveOrigin(request: Request): string | null {
  const origin = request.headers.get("origin") || "";
  if (allowedOrigins().has(origin)) return origin;
  return null; // reject unlisted origins — no ACAO header will be set
}

export function corsHeaders(request: Request): Headers {
  const headers = new Headers();
  const origin = resolveOrigin(request);
  if (origin !== null) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  headers.set("Access-Control-Allow-Headers", "content-type, authorization, x-client-info, apikey, x-booking-token, stripe-signature");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Vary", "Origin");
  return headers;
}

export function optionsResponse(request: Request): Response {
  return new Response("ok", { headers: corsHeaders(request) });
}
