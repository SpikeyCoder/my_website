interface BookingTokenPayload {
  email: string;
  exp: number;
}

const TOKEN_TTL_SECONDS = 31449600; // 364 days

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
  const secret = Deno.env.get("BOOKING_TOKEN_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!secret) throw new Error("Missing BOOKING_TOKEN_SECRET env var");
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
  if (expected !== signature) return null;

  const payloadRaw = new TextDecoder().decode(fromBase64Url(encodedPayload));
  const payload = JSON.parse(payloadRaw) as BookingTokenPayload;
  if (!payload?.email || !payload?.exp) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}
