// Constant-time string equality. Returns true iff the byte-encoded forms of
// `a` and `b` have identical length and contents. Used for HMAC and admin
// token comparisons so that early-exit string equality cannot leak a timing
// side channel.
//
// References: CWE-208 Observable Timing Discrepancy.
export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}
