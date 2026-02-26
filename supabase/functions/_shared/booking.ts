export function normalizeEmail(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function bookingTokenCookie(token: string): string {
  // Lax is requested in the project plan. Client also stores token for cross-origin fallback.
  return `bookingToken=${encodeURIComponent(token)}; Max-Age=31449600; Path=/; HttpOnly; Secure; SameSite=Lax`;
}
