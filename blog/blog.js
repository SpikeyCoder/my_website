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
const GOINGVEGAN_CLEAN_SLUGS = new Set([
  "how-many-animals-does-going-vegan-save-per-year",
  "the-psychology-of-vegan-streaks-why-tracking-your-plant-based-days-works",
  "going-vegan-without-losing-muscle-a-practical-guide",
]);
const GOINGVEGAN_TAGS = new Set(["goingvegan", "vegan"]);

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

function stripSlugHashSuffix(value) {
  return String(value || "").replace(/-[a-f0-9]{8}$/i, "");
}

function slugifyPostTitle(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "") || "post";
}

function buildCanonicalPostSlug(post) {
  const fromTitle = slugifyPostTitle(post?.title || "");
  if (fromTitle) return fromTitle;
  const fromStoredSlug = stripSlugHashSuffix(post?.slug || "");
  return fromStoredSlug || "post";
}

function buildCanonicalSlugById(posts) {
  const counts = new Map();
  const canonicalById = new Map();
  for (const post of posts) {
    const base = buildCanonicalPostSlug(post);
    const ordinal = (counts.get(base) || 0) + 1;
    counts.set(base, ordinal);
    const canonical = ordinal === 1 ? base : `${base}-${ordinal}`;
    canonicalById.set(String(post.id), canonical);
  }
  return canonicalById;
}

function classifyGoingVeganPost(post) {
  const cleanSlug = stripSlugHashSuffix(post?.slug || "");
  if (GOINGVEGAN_CLEAN_SLUGS.has(cleanSlug)) return true;
  const tags = Array.isArray(post?.tags) ? post.tags : [];
  const normalizedTags = tags.map((tag) => String(tag || "").trim().toLowerCase());
  return normalizedTags.some((tag) => GOINGVEGAN_TAGS.has(tag));
}

function getRouteContext() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const basePath = getSiteBasePath();
  const relativePath = basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) || "/" : pathname;
  const isGoingVegan = /^\/goingvegan\/blog(?:\/|$)/i.test(relativePath);
  return {
    basePath,
    relativePath,
    isGoingVegan,
    blogBase: isGoingVegan ? "/goingvegan/blog" : "/blog",
    listPath: isGoingVegan ? "/goingvegan/#gv-blog" : "/#blog",
  };
}

const ROUTE_CONTEXT = getRouteContext();

function getSlugFromRoute() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = decodeSlug(params.get("slug"));
  if (fromQuery) return fromQuery;

  const match = ROUTE_CONTEXT.relativePath.match(/^\/(?:goingvegan\/)?blog\/([^/?#]+)$/i);
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
  return `${ROUTE_CONTEXT.basePath}${ROUTE_CONTEXT.blogBase}/${encodeURIComponent(slug)}/`;
}

function buildCanonicalBlogPath(slug) {
  return `${ROUTE_CONTEXT.blogBase}/${encodeURIComponent(slug)}/`;
}

function buildBlogUrl(slug) {
  return `${getCanonicalOrigin()}${buildCanonicalBlogPath(slug)}`;
}

function blogListUrl() {
  return `${window.location.origin}${ROUTE_CONTEXT.basePath}${ROUTE_CONTEXT.listPath}`;
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

function calculateReadingTime(raw) {
  let text = String(raw || "");
  if (!text.trim()) return 1;
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/<[^>]+>/g, " ");
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return 1;
  return Math.max(1, Math.ceil(words.length / 220));
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
  let canonicalById = new Map();

  const { data: exactData, error: exactError } = await supabase
    .from("posts")
    .select("id,slug,title,summary,content,tags,published_at")
    .eq("slug", slug)
    .maybeSingle();

  if (exactError) {
    statusEl.textContent = `Unable to load post: ${exactError.message}`;
    return;
  }

  let data = exactData;
  if (!data) {
    const baseSlug = stripSlugHashSuffix(slug);
    const { data: fallbackRows, error: fallbackError } = await supabase
      .from("posts")
      .select("id,slug,title,summary,content,tags,published_at")
      .ilike("slug", `${baseSlug}-%`)
      .order("published_at", { ascending: false })
      .limit(1);

    if (fallbackError) {
      statusEl.textContent = `Unable to load post: ${fallbackError.message}`;
      return;
    }

    data = Array.isArray(fallbackRows) && fallbackRows.length ? fallbackRows[0] : null;
  }

  const { data: orderedRows, error: orderedRowsError } = await supabase
    .from("posts")
    .select("id,slug,title,summary,content,tags,published_at")
    .order("published_at", { ascending: false })
    .limit(200);

  if (orderedRowsError && !data) {
    statusEl.textContent = `Unable to load post: ${orderedRowsError.message}`;
    return;
  }

  if (Array.isArray(orderedRows) && orderedRows.length) {
    canonicalById = buildCanonicalSlugById(orderedRows);

    if (!data) {
      const targetSlug = String(slug || "").toLowerCase();
      data =
        orderedRows.find((row) => {
          const canonical = canonicalById.get(String(row.id)) || "";
          return canonical.toLowerCase() === targetSlug;
        }) || null;
    }
  }

  if (!data) {
    redirectToBlogList();
    return;
  }

  const finalSlug = canonicalById.get(String(data.id)) || buildCanonicalPostSlug(data);
  const shouldBeGoingVegan = classifyGoingVeganPost(data);
  if (shouldBeGoingVegan !== ROUTE_CONTEXT.isGoingVegan) {
    const targetBase = shouldBeGoingVegan ? "/goingvegan/blog" : "/blog";
    const targetUrl = `${window.location.origin}${ROUTE_CONTEXT.basePath}${targetBase}/${encodeURIComponent(finalSlug)}/`;
    window.location.replace(targetUrl);
    return;
  }

  const published = data.published_at ? new Date(data.published_at).toLocaleString() : "";
  const readingMinutes = calculateReadingTime(data.content || "");
  const readingLabel = ` • ${readingMinutes} min read`;
  const tags = Array.isArray(data.tags) && data.tags.length ? ` • ${data.tags.join(", ")}` : "";

  titleEl.textContent = data.title || "Untitled";
  summaryEl.textContent = data.summary || "";
  metaEl.textContent = `${published}${published ? readingLabel : readingLabel.replace(/^ • /, "")}${tags}`.trim();
  contentEl.innerHTML = renderMarkdown(data.content || "");

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
