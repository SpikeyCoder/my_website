document.body.classList.add("js");

const SUPABASE_URL = "https://efrkjqbrfsynzdjbgqck.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hZ74MUnNhGncPQNHdx9YAA_GThc73YP";

const statusEl = document.getElementById("blog-article-status");
const shellEl = document.getElementById("blog-article-shell");
const titleEl = document.getElementById("blog-article-title");
const summaryEl = document.getElementById("blog-article-summary");
const metaEl = document.getElementById("blog-article-meta");
const contentEl = document.getElementById("blog-article-content");
const shareRootEl = document.getElementById("blog-article-share");
const backEl = document.getElementById("blog-article-back");

const ALLOWED_STYLE_PROPS = new Set(["color", "font-size", "font-family", "text-decoration"]);
const ALLOWED_FAMILIES = new Set(["D-DIN", "JetBrains Mono", "monospace"]);

function supabaseReady() {
  return Boolean(window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY);
}

function getSiteBasePath() {
  return window.location.pathname.startsWith("/my_website/") ? "/my_website" : "";
}

function decodeSlug(value) {
  try {
    return decodeURIComponent(String(value || "").trim());
  } catch (_error) {
    return String(value || "").trim();
  }
}

function getSlugFromRoute() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = decodeSlug(params.get("slug"));
  if (fromQuery) return fromQuery;

  const basePath = getSiteBasePath();
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const relative = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) || "/" : pathname;
  const match = relative.match(/^\/blog\/([^/?#]+)$/i);
  return match?.[1] ? decodeSlug(match[1]) : "";
}

function getCanonicalOrigin() {
  const canonicalEl = document.querySelector("link[rel='canonical']");
  if (canonicalEl?.href) {
    try {
      return new URL(canonicalEl.href, window.location.href).origin;
    } catch (_error) {
      // Fallback below.
    }
  }
  return window.location.origin;
}

function buildRuntimeBlogPath(slug) {
  const basePath = getSiteBasePath();
  return `${basePath}/blog/${encodeURIComponent(slug)}/`;
}

function buildCanonicalBlogPath(slug) {
  return `/blog/${encodeURIComponent(slug)}/`;
}

function buildBlogUrl(slug) {
  return `${getCanonicalOrigin()}${buildCanonicalBlogPath(slug)}`;
}

function blogListUrl() {
  const basePath = getSiteBasePath();
  return `${window.location.origin}${basePath}/#blog`;
}

function redirectToBlogList() {
  window.location.replace(blogListUrl());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeInlineStyle(rawStyle) {
  if (!rawStyle) return "";

  const out = [];
  for (const chunk of rawStyle.split(";")) {
    const [propRaw, ...valueParts] = chunk.split(":");
    if (!propRaw || !valueParts.length) continue;

    const prop = propRaw.trim().toLowerCase();
    let value = valueParts.join(":").trim();
    if (!ALLOWED_STYLE_PROPS.has(prop)) continue;

    if (prop === "color") {
      if (!/^#[0-9a-fA-F]{6}$/.test(value)) continue;
      out.push(`color:${value.toLowerCase()}`);
      continue;
    }

    if (prop === "font-size") {
      const match = value.match(/^([0-9]{1,2})px$/i);
      if (!match) continue;
      const px = Number(match[1]);
      if (px < 10 || px > 32) continue;
      out.push(`font-size:${px}px`);
      continue;
    }

    if (prop === "font-family") {
      const families = value
        .split(",")
        .map((item) => item.trim().replaceAll('"', "").replaceAll("'", ""))
        .filter(Boolean);
      const safe = families.filter((item) => ALLOWED_FAMILIES.has(item));
      if (!safe.length) continue;
      out.push(`font-family:${safe.map((item) => `"${item}"`).join(",")}`);
      continue;
    }

    if (prop === "text-decoration") {
      value = value.toLowerCase();
      if (value !== "underline") continue;
      out.push("text-decoration:underline");
    }
  }

  return out.join(";");
}

function renderMarkdown(content) {
  if (!content) return "";
  if (!(window.marked && window.DOMPurify)) return escapeHtml(content);

  window.DOMPurify.setConfig({
    ADD_TAGS: ["span", "u"],
    ADD_ATTR: ["style"],
    FORBID_ATTR: ["onerror", "onload", "onclick"],
  });

  window.DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
    if (data.attrName !== "style") return;
    data.attrValue = sanitizeInlineStyle(data.attrValue);
  });

  const html = window.marked.parse(content, { breaks: true });
  return window.DOMPurify.sanitize(html);
}

function setCanonical(slug) {
  const canonicalHref = buildBlogUrl(slug);
  const canonicalEl = document.querySelector("link[rel='canonical']");
  if (canonicalEl) canonicalEl.setAttribute("href", canonicalHref);
  if (shareRootEl) {
    shareRootEl.dataset.shareUrl = canonicalHref;
  }
}

function hydrateShareMenu() {
  if (window.SocialShare?.setupShareMenus && shareRootEl) {
    window.SocialShare.setupShareMenus(document);
  }
}

async function loadPost() {
  const slug = getSlugFromRoute();
  if (!slug) {
    redirectToBlogList();
    return;
  }

  if (!supabaseReady()) {
    statusEl.textContent = "Unable to load post (Supabase not configured).";
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabase
    .from("posts")
    .select("id,slug,title,summary,content,tags,published_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    statusEl.textContent = `Unable to load post: ${error.message}`;
    return;
  }

  if (!data) {
    redirectToBlogList();
    return;
  }

  const published = data.published_at ? new Date(data.published_at).toLocaleString() : "";
  const tags = Array.isArray(data.tags) && data.tags.length ? ` • ${data.tags.join(", ")}` : "";

  titleEl.textContent = data.title || "Untitled";
  summaryEl.textContent = data.summary || "";
  metaEl.textContent = `${published}${tags}`.trim();
  contentEl.innerHTML = renderMarkdown(data.content || "");

  const finalSlug = data.slug || slug;
  const finalPath = buildRuntimeBlogPath(finalSlug);
  if (window.location.pathname !== finalPath || window.location.search) {
    window.history.replaceState({}, "", finalPath);
  }

  setCanonical(finalSlug);
  document.title = `${data.title || "Post"} | Live Blog | Kevin Armstrong`;

  if (backEl) backEl.href = blogListUrl();

  statusEl.hidden = true;
  shellEl.hidden = false;
  hydrateShareMenu();
}

loadPost();
