import { corsHeaders } from "./cors.ts";

export function jsonResponse(request: Request, status: number, payload: unknown, extraHeaders?: HeadersInit): Response {
  const headers = corsHeaders(request);
  headers.set("Content-Type", "application/json");

  if (extraHeaders) {
    const extras = new Headers(extraHeaders);
    extras.forEach((value, key) => headers.append(key, value));
  }

  return new Response(JSON.stringify(payload), { status, headers });
}

export function readCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const parts = cookie.split(";").map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${name}=`));
  if (!found) return null;
  return decodeURIComponent(found.slice(name.length + 1));
}

export function tokenFromRequest(request: Request): string | null {
  return request.headers.get("x-booking-token") || readCookie(request, "bookingToken");
}

/**
 * KA-2026-05-22-01: sanitise outbound error payloads.
 *
 * Returning raw `error.message` from Supabase / Deno runtime to the client
 * is information disclosure (CWE-209, OWASP A09:2021). Postgres error
 * strings can leak schema, constraint, and column names; runtime errors can
 * leak file paths and stack-trace fragments. Internally we still want the
 * full message in Cloud Run / Supabase Function logs.
 *
 * `sanitiseError(err, fallback)` logs the raw error server-side and returns
 * a generic public-facing message. Always use it as the body of the catch
 * block before `jsonResponse(..., 500, { error: ... })`.
 */
export function sanitiseError(err: unknown, fallback = "Internal server error"): string {
  // Log full detail server-side for triage; Cloud Run / Supabase functions
  // capture stderr automatically. console.error is intentionally one line so
  // the log line ingests cleanly.
  try {
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[sanitised_error] ${detail}`);
  } catch {
    // Never let logging take down the response path.
  }
  return fallback;
}
