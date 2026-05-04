export function normalizeEmail(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Single source of truth lives in _shared/token.ts so the cookie Max-Age and
// the signed-token expiry can no longer drift apart. Pentest 2026-05-04
// finding KA-2026-05-04-03.
import { BOOKING_TTL_SECONDS } from "./token.ts";
const BOOKING_COOKIE_MAX_AGE = BOOKING_TTL_SECONDS;

export function bookingTokenCookie(token: string): string {
  // Lax is requested in the project plan. Client also stores token for cross-origin fallback.
  return `bookingToken=${encodeURIComponent(token)}; Max-Age=${BOOKING_COOKIE_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}
