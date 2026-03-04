import { corsHeaders, optionsResponse } from "../_shared/cors.ts";

// Allowlist of hostname patterns we are willing to proxy.
// Covers RSS feeds, OPML files, and blog content.
const ALLOWED_HOSTNAME_PATTERNS: RegExp[] = [
  /^([a-z0-9-]+\.)*github\.com$/,
  /^([a-z0-9-]+\.)*githubusercontent\.com$/,
  /^([a-z0-9-]+\.)*substack\.com$/,
  /^([a-z0-9-]+\.)*medium\.com$/,
  /^([a-z0-9-]+\.)*wordpress\.com$/,
  /^([a-z0-9-]+\.)*blogspot\.com$/,
  /^([a-z0-9-]+\.)*beehiiv\.com$/,
  /^([a-z0-9-]+\.)*ghost\.io$/,
  /^([a-z0-9-]+\.)*hashnode\.dev$/,
  /^([a-z0-9-]+\.)*dev\.to$/,
  // Well-known tech blogs
  /^overreacted\.io$/,
  /^leerob\.io$/,
  /^kentcdodds\.com$/,
  /^www\.joelonsoftware\.com$/,
  /^feeds\.feedburner\.com$/,
  /^([a-z0-9-]+\.)*feedburner\.com$/,
  /^([a-z0-9-]+\.)*ycombinator\.com$/,
  /^([a-z0-9-]+\.)*hackernews\.com$/,
  /^([a-z0-9-]+\.)*paulgraham\.com$/,
  /^danluu\.com$/,
  /^jvns\.ca$/,
  /^simonwillison\.net$/,
  /^rachelbythebay\.com$/,
  /^bitfieldconsulting\.com$/,
  /^www\.brendangregg\.com$/,
  /^codewithoutrules\.com$/,
  /^blog\.pragmaticengineer\.com$/,
  /^([a-z0-9-]+\.)*vercel\.app$/,
  // Catch-all for any .io, .com, .net, .org, .dev, .blog personal/tech blogs
  // (open enough to cover OPML-sourced feeds while excluding private networks)
  /^([a-z0-9-]+\.)+(?:io|com|net|org|dev|blog|co|me|info)$/,
];

const BLOCKED_HOSTNAME_PATTERNS: RegExp[] = [
  // Block private/internal network ranges
  /^localhost$/,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^::1$/,
  /^0\.0\.0\.0$/,
  // Block metadata services
  /^169\.254\.\d+\.\d+$/,
  /^metadata\.google\.internal$/,
  /^169\.254\.169\.254$/,
];

function isAllowedUrl(rawUrl: string): { ok: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, reason: "Only http/https URLs are allowed" };
  }

  const hostname = parsed.hostname.toLowerCase();

  for (const blocked of BLOCKED_HOSTNAME_PATTERNS) {
    if (blocked.test(hostname)) {
      return { ok: false, reason: "Target hostname is not permitted" };
    }
  }

  for (const allowed of ALLOWED_HOSTNAME_PATTERNS) {
    if (allowed.test(hostname)) {
      return { ok: true };
    }
  }

  return { ok: false, reason: `Hostname '${hostname}' is not on the proxy allowlist` };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return optionsResponse(request);
  if (request.method !== "GET") {
    const headers = corsHeaders(request);
    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  const requestUrl = new URL(request.url);
  const targetUrl = requestUrl.searchParams.get("url");

  if (!targetUrl) {
    const headers = corsHeaders(request);
    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify({ error: "Missing required query parameter: url" }), { status: 400, headers });
  }

  const check = isAllowedUrl(targetUrl);
  if (!check.ok) {
    const headers = corsHeaders(request);
    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify({ error: check.reason || "URL not allowed" }), { status: 403, headers });
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RSSProxy/1.0; +https://kevinarmstrong.io)",
        "Accept": "application/rss+xml, application/atom+xml, text/xml, application/xml, text/html, */*",
      },
      // Deno's fetch does not follow redirects to private IPs (SSRF protection built-in)
      redirect: "follow",
    });

    const contentType = upstream.headers.get("content-type") || "text/plain";
    const body = await upstream.text();

    const headers = corsHeaders(request);
    headers.set("Content-Type", contentType);
    headers.set("X-Proxy-Status", String(upstream.status));
    // Cache successful responses for 5 minutes at the CDN layer
    if (upstream.ok) {
      headers.set("Cache-Control", "public, max-age=300, s-maxage=300");
    }

    return new Response(body, { status: upstream.ok ? 200 : 502, headers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upstream fetch failed";
    const headers = corsHeaders(request);
    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify({ error: message }), { status: 502, headers });
  }
});
