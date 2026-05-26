/**
 * Constant-time string equality.
 *
 * Comparing secrets (HMAC signatures, admin tokens, channel ids) with `===`
 * short-circuits on the first byte mismatch, leaking length and prefix
 * information through wall-clock timing. Use this helper instead.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
