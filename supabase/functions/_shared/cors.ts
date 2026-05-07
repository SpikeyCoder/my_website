// CORS allowlist for Supabase Edge Functions.
//
// Production origins are always allowed. Localhost dev origins are
// allow-listed only when ENVIRONMENT === "development" so they cannot be
// abused if production ever runs against a misconfigured Deno deployment
// or shared dev environment. Pen-test 2026-05-07 finding KA-2026-05-07-02.
const PROD_ORIGINS = new Set([
  "https://kevinarmstrong.io",
  "https://www.kevinarmstrong.io",
  "https://spikeycoder.github.io",
]);

const DEV_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:5173",
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
