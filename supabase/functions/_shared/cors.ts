const ALLOWED_ORIGINS = new Set([
  "https://kevinarmstrong.io",
  "https://www.kevinarmstrong.io",
  "https://spikeycoder.github.io",
  "http://localhost:3000",
  "http://localhost:5173",
]);

export function resolveOrigin(request: Request): string | null {
  const origin = request.headers.get("origin") || "";
  if (ALLOWED_ORIGINS.has(origin)) return origin;
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
