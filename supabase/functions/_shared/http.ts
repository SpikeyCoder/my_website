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
