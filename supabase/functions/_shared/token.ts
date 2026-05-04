import { timingSafeEqual } from "./timing_safe.ts";

interface BookingTokenPayload {
  email: string;
  exp: number;
}

// Single source of truth for booking-token + cookie lifetime. _shared/booking.ts
// imports BOOKING_TTL_SECONDS so the cookie Max-Age cannot drift away from the
// signed-token expiry. See pentest 2026-05-04 finding KA-2026-05-04-03.
export const BOOKING_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

// Backwards-compatible alias preserved for any external import.
export const TOKEN_TTL_SECONDS = BOOKING_TTL_SECONDS;

function toBase64Url(input: Uint8Array): string {
  let output = "";
  for (const byte of input) {
    output += String.fromCharCode(byte);
  }
  return btoa(output).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function sign(input: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(input));
  return toBase64Url(new Uint8Array(signature));
}

function getSecret(): string {
  // Require an explicit, dedicated secret. Falling back to
  // SUPABASE_SERVICE_ROLE_KEY (the previous behaviour) violated key
  // separation: rotating the service-role key would invalidate every
  // issued booking token, and a service-role-key leak would compound
  // into token forgery. See pentest 2026-04-30 finding KA-10.
  const secret = Deno.env.get("BOOKING_TOKEN_SECRET") || "";
  if (!secret) {
    throw new Error(
      "Missing BOOKING_TOKEN_SECRET env var (set with: supabase secrets set BOOKING_TOKEN_SECRET=$(openssl rand -hex 32))",
    );
  }
  if (secret.length < 32) {
    throw new Error("BOOKING_TOKEN_SECRET must be at least 32 characters");
  }
  return secret;
}

export async function createBookingToken(email: string): Promise<string> {
  const payload: BookingTokenPayload = {
    email,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };

  const encodedPayload = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await sign(encodedPayload, getSecret());
  return `${encodedPayload}.${signature}`;
}

export async function verifyBookingToken(token: string | null): Promise<BookingTokenPayload | null> {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = await sign(encodedPayload, getSecret());
  // Constant-time compare avoids leaking the HMAC tag one byte at a time
  // through wall-clock timing. Pentest 2026-05-04 finding KA-2026-05-04-02.
  if (!timingSafeEqual(expected, signature)) return null;

  const payloadRaw = new TextDecoder().decode(fromBase64Url(encodedPayload));
  const payload = JSON.parse(payloadRaw) as BookingTokenPayload;
  if (!payload?.email || !payload?.exp) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}
