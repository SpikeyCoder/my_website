interface ServiceAccountConfig {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface CachedToken {
  accessToken: string;
  expiresAtEpochSeconds: number;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface JsonMap {
  [key: string]: unknown;
}

let cachedToken: CachedToken | null = null;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function getServiceAccount(): ServiceAccountConfig {
  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") || "";
  if (!raw) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON secret");
  }

  let parsed: JsonMap;
  try {
    parsed = JSON.parse(raw);
  } catch (_error) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }

  const clientEmail = String(parsed.client_email || "").trim();
  const privateKey = String(parsed.private_key || "").trim();
  const tokenUri = String(parsed.token_uri || "https://oauth2.googleapis.com/token").trim();

  if (!clientEmail || !privateKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON must include client_email and private_key");
  }

  return {
    client_email: clientEmail,
    private_key: privateKey,
    token_uri: tokenUri,
  };
}

function getCalendarId(): string {
  const calendarId = String(Deno.env.get("GOOGLE_CALENDAR_ID") || "").trim();
  if (!calendarId) {
    throw new Error("Missing GOOGLE_CALENDAR_ID secret");
  }
  return calendarId;
}

export function getServiceAccountEmail(): string {
  return getServiceAccount().client_email.toLowerCase();
}

export function getGoogleCalendarId(): string {
  return getCalendarId();
}

export function getAppointmentSetId(): string {
  return String(Deno.env.get("GOOGLE_APPOINTMENT_SET_KEY") || "default_cita").trim();
}

export function getWebhookTtlSeconds(): number {
  const value = Number(Deno.env.get("GOOGLE_CALENDAR_WATCH_TTL_SECONDS") || "604800");
  if (!Number.isFinite(value) || value <= 0) return 604800;
  // Google Calendar watch currently allows max 7 days.
  return Math.min(Math.floor(value), 604800);
}

async function createSignedJwt(config: ServiceAccountConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iss: config.client_email,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: config.token_uri || "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = toBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsigned = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(config.private_key),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );

  const encodedSignature = toBase64Url(new Uint8Array(signature));
  return `${unsigned}.${encodedSignature}`;
}

export async function getGoogleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAtEpochSeconds - 60 > now) {
    return cachedToken.accessToken;
  }

  const config = getServiceAccount();
  const assertion = await createSignedJwt(config);

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const response = await fetch(config.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json().catch(() => ({}))) as Partial<TokenResponse> & JsonMap;

  if (!response.ok || !payload.access_token) {
    const detail = typeof payload.error_description === "string"
      ? payload.error_description
      : typeof payload.error === "string"
      ? payload.error
      : "unknown";
    throw new Error(`Failed to get Google access token: ${detail}`);
  }

  const expiresIn = Number(payload.expires_in || 3600);
  cachedToken = {
    accessToken: payload.access_token,
    expiresAtEpochSeconds: now + (Number.isFinite(expiresIn) ? expiresIn : 3600),
  };

  return cachedToken.accessToken;
}

export async function googleCalendarRequest(
  path: string,
  options: RequestInit,
  query: Record<string, string | undefined> = {},
): Promise<Response> {
  const token = await getGoogleAccessToken();
  const url = new URL(`https://www.googleapis.com/calendar/v3/${path}`);

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url.toString(), {
    ...options,
    headers,
  });
}
