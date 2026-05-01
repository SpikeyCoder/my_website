export function normalizeEmail(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// 30 days, matches TOKEN_TTL_SECONDS in _shared/token.ts.
const BOOKING_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export function bookingTokenCookie(token: string): string {
  // Lax is requested in the project plan. Client also stores token for cross-origin fallback.
  return `bookingToken=${encodeURIComponent(token)}; Max-Age=${BOOKING_COOKIE_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}
