export function normalizeEmail(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function bookingTokenCookie(token: string): string {
  // Lax is requested in the project plan. Client also stores token for cross-origin fallback.
  // 30-day TTL — rotated server-side on every successful booking call.
  return `bookingToken=${encodeURIComponent(token)}; Max-Age=2592000; Path=/; HttpOnly; Secure; SameSite=Lax`;
}
