#!/usr/bin/env python3
"""Generate static blog slug routes with crawlable metadata."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

SUPABASE_URL = "https://efrkjqbrfsynzdjbgqck.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_hZ74MUnNhGncPQNHdx9YAA_GThc73YP"
CANONICAL_ORIGIN = "https://kevinarmstrong.io"
DEFAULT_OG_IMAGE_URL = f"{CANONICAL_ORIGIN}/apple-touch-icon.png"
MAX_POSTS = 200
GEN_MARKER = "<!-- GENERATED_BLOG_ROUTE -->"
SCRIPT_VERSION = "20260322a"

GOINGVEGAN_CLEAN_SLUGS = {
    "how-many-animals-does-going-vegan-save-per-year",
    "the-psychology-of-vegan-streaks-why-tracking-your-plant-based-days-works",
    "going-vegan-without-losing-muscle-a-practical-guide",
}
GOINGVEGAN_TAGS = {"goingvegan", "vegan"}


def fetch_posts() -> list[dict]:
    endpoint = (
        f"{SUPABASE_URL}/rest/v1/posts"
        f"?select=slug,title,summary,published_at,tags"
        f"&order=published_at.desc"
        f"&limit={MAX_POSTS}"
    )
    req = Request(
        endpoint,
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        },
    )
    with urlopen(req, timeout=20) as response:
        payload = response.read().decode("utf-8")
    data = json.loads(payload)
    if not isinstance(data, list):
        raise RuntimeError("Unexpected Supabase response while generating blog routes.")
    return data


def clean_slug(value: str) -> str:
    return str(value or "").strip().strip("/")


def safe_summary(value: str) -> str:
    text = " ".join(str(value or "").split())
    return text[:220]


def strip_hash_suffix(slug: str) -> str:
    return re.sub(r"-[a-f0-9]{8}$", "", slug, flags=re.IGNORECASE)


def normalize_tags(raw_tags: object) -> set[str]:
    if isinstance(raw_tags, list):
        return {str(tag or "").strip().lower() for tag in raw_tags if str(tag or "").strip()}
    if isinstance(raw_tags, str):
        return {tag.strip().lower() for tag in raw_tags.split(",") if tag.strip()}
    return set()


def is_goingvegan_post(post: dict, canonical_slug: str) -> bool:
    if canonical_slug in GOINGVEGAN_CLEAN_SLUGS:
        return True
    tags = normalize_tags(post.get("tags"))
    return any(tag in GOINGVEGAN_TAGS for tag in tags)


def resolve_og_image_url(repo_root: Path, slug: str) -> str:
    candidate = repo_root / "assets" / "blog-og" / f"{slug}.png"
    if candidate.exists():
        return f"{CANONICAL_ORIGIN}/assets/blog-og/{quote(slug, safe='')}.png"
    return DEFAULT_OG_IMAGE_URL


def build_page(
    *,
    route_slug: str,
    canonical_slug: str,
    canonical_base: str,
    title: str,
    summary: str,
    published_at: str,
    og_image_url: str,
    page_title_suffix: str,
    asset_prefix: str,
    module_src: str,
    nav_home_href: str,
    nav_list_href: str,
    nav_list_label: str,
    back_href: str,
    back_label: str,
    noscript_href_base: str,
) -> str:
    slug_q = quote(route_slug, safe="")
    canonical_url = f"{CANONICAL_ORIGIN}{canonical_base}/{canonical_slug}/"
    title_text = title or "Live Blog Article"
    desc_text = summary or "Live Blog article by Kevin Armstrong."
    published = published_at or ""
    json_ld = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title_text,
        "description": desc_text,
        "url": canonical_url,
        "datePublished": published,
        "author": {"@type": "Person", "name": "Kevin Armstrong"},
        "publisher": {"@type": "Organization", "name": "Armstrong HoldCo LLC"},
        "image": og_image_url,
    }

    return f"""<!doctype html>
<html lang=\"en\">
  <head>
    {GEN_MARKER}
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>{html.escape(title_text)} | {html.escape(page_title_suffix)}</title>
    <meta name=\"description\" content=\"{html.escape(desc_text)}\" />
    <link rel=\"canonical\" href=\"{html.escape(canonical_url)}\" />
    <meta property=\"og:type\" content=\"article\" />
    <meta property=\"og:title\" content=\"{html.escape(title_text)}\" />
    <meta property=\"og:description\" content=\"{html.escape(desc_text)}\" />
    <meta property=\"og:url\" content=\"{html.escape(canonical_url)}\" />
    <meta property=\"og:image\" content=\"{html.escape(og_image_url)}\" />
    <meta property=\"article:published_time\" content=\"{html.escape(published)}\" />
    <meta name=\"twitter:card\" content=\"summary_large_image\" />
    <meta name=\"twitter:title\" content=\"{html.escape(title_text)}\" />
    <meta name=\"twitter:description\" content=\"{html.escape(desc_text)}\" />
    <meta name=\"twitter:image\" content=\"{html.escape(og_image_url)}\" />
    <link rel=\"preconnect\" href=\"https://cdn.jsdelivr.net\" crossorigin />
    <link rel=\"preconnect\" href=\"https://efrkjqbrfsynzdjbgqck.supabase.co\" crossorigin />
    <link rel=\"preconnect\" href=\"https://gc.zgo.at\" crossorigin />
    <link rel=\"stylesheet\" href=\"{asset_prefix}styles.css?v={SCRIPT_VERSION}\" />
    <link rel=\"icon\" href=\"{asset_prefix}favicon.ico\" sizes=\"any\" />
    <link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"{asset_prefix}favicon-32x32.png\" />
    <link rel=\"icon\" type=\"image/png\" sizes=\"16x16\" href=\"{asset_prefix}favicon-16x16.png\" />
    <link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"{asset_prefix}apple-touch-icon.png\" />
    <script type=\"application/ld+json\">{json.dumps(json_ld)}</script>
  </head>
  <body>
    <div class=\"ambient\" aria-hidden=\"true\"></div>

    <nav class=\"site-nav\">
      <div class=\"container nav-inner\">
        <div class=\"nav-brand\">ARMSTRONG HOLDCO LLC</div>
        <div class=\"nav-links\">
          <a href=\"{html.escape(nav_home_href)}\">Home</a>
          <a href=\"{html.escape(nav_list_href)}\">{html.escape(nav_list_label)}</a>
        </div>
      </div>
    </nav>

    <main class=\"blog-article-page\">
      <section class=\"section\">
        <div class=\"container reveal blog-article-card\">
          <p class=\"blog-article-status\" id=\"blog-article-status\">Loading post…</p>

          <div id=\"blog-article-shell\" hidden>
            <div class=\"blog-article-header\">
              <h1 class=\"blog-article-title\" id=\"blog-article-title\"></h1>
              <div class=\"blog-share\" id=\"blog-article-share\" data-share-root data-share-url=\"{html.escape(canonical_url)}\" data-share-copy-url=\"{html.escape(canonical_url)}\">
                <button class=\"blog-share-trigger\" type=\"button\" data-share-trigger aria-haspopup=\"menu\" aria-expanded=\"false\" aria-label=\"Share post\">
                  <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M18 16.08a2.94 2.94 0 0 0-1.95.77l-6.32-3.69a2.8 2.8 0 0 0 0-2.32l6.32-3.7A3 3 0 1 0 15 5a2.8 2.8 0 0 0 .05.51l-6.32 3.7a3 3 0 1 0 0 5.58l6.32 3.7A2.8 2.8 0 0 0 15 19a3 3 0 1 0 3-2.92z\" fill=\"currentColor\"></path></svg>
                </button>
                <div class=\"share-menu\" data-share-menu role=\"menu\" aria-label=\"Share Post\" hidden>
                  <div class=\"share-menu-header\">
                    <h5 class=\"share-menu-title\">Share Post</h5>
                    <button class=\"share-close\" type=\"button\" data-share-close aria-label=\"Close share menu\">×</button>
                  </div>
                  <div class=\"share-menu-items\">
                    <a class=\"share-menu-item\" role=\"menuitem\" data-share-network=\"linkedin\" target=\"_blank\" rel=\"noopener noreferrer\">
                      <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.48 1s2.5 1.12 2.5 2.5zM.5 8h4V23h-4zM8 8h3.83v2.05h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.09V23h-4v-7.29c0-1.74-.03-3.98-2.42-3.98-2.42 0-2.79 1.89-2.79 3.85V23H8z\" fill=\"currentColor\"></path></svg>
                      <span>LinkedIn</span>
                    </a>
                    <a class=\"share-menu-item\" role=\"menuitem\" data-share-network=\"x\" target=\"_blank\" rel=\"noopener noreferrer\">
                      <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M18.9 2H22l-6.8 7.78L23.2 22h-6.27l-4.9-6.93L6.03 22H2.9l7.28-8.32L.6 2h6.43l4.43 6.27zM17.8 20h1.73L6.1 3.9H4.25z\" fill=\"currentColor\"></path></svg>
                      <span>Twitter / X</span>
                    </a>
                    <button class=\"share-menu-item\" role=\"menuitem\" type=\"button\" data-share-copy>
                      <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M16 1H4a2 2 0 0 0-2 2v12h2V3h12z\" fill=\"currentColor\"></path><path d=\"M8 5h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v14h12V7z\" fill=\"currentColor\"></path></svg>
                      <span>Copy Link</span>
                    </button>
                  </div>
                </div>
                <span class=\"copy-feedback\" data-copy-feedback aria-live=\"polite\"></span>
              </div>
            </div>

            <p class=\"blog-article-summary\" id=\"blog-article-summary\">{html.escape(desc_text)}</p>
            <p class=\"blog-article-meta\" id=\"blog-article-meta\"></p>
            <article class=\"blog-article-content\" id=\"blog-article-content\"></article>
            <a class=\"link\" id=\"blog-article-back\" href=\"{html.escape(back_href)}\">{html.escape(back_label)}</a>
          </div>

          <noscript>
            <p>
              JavaScript is required to render the full article content.
              <a href=\"{noscript_href_base}?slug={slug_q}&amp;from=path\">Open article viewer</a>
            </p>
          </noscript>
        </div>
      </section>
    </main>

    <script defer src=\"{asset_prefix}analytics.js?v=20260302a\"></script>
    <script src=\"{asset_prefix}social.js?v=20260301e\"></script>
    <script src=\"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2\"></script>
    <script src=\"https://cdn.jsdelivr.net/npm/dompurify@3.0.11/dist/purify.min.js\"></script>
    <script src=\"https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js\"></script>
    <script type=\"module\" src=\"{module_src}\"></script>
  </body>
</html>
"""


def remove_stale_generated_dirs(root: Path, expected_slugs: set[str]) -> None:
    if not root.exists():
        return
    for child in root.iterdir():
        if not child.is_dir():
            continue
        if child.name in {"assets"}:
            continue
        index_file = child / "index.html"
        if not index_file.exists():
            continue
        if child.name in expected_slugs:
            continue
        try:
            body = index_file.read_text(encoding="utf-8")
        except Exception:
            continue
        if GEN_MARKER in body:
            index_file.unlink(missing_ok=True)
            try:
                child.rmdir()
            except OSError:
                pass


def write_route_page(
    *,
    root: Path,
    route_slug: str,
    used_slugs: set[str],
    expected_slugs: set[str],
    page_html: str,
) -> bool:
    if route_slug in used_slugs:
        return False
    used_slugs.add(route_slug)
    expected_slugs.add(route_slug)
    target_dir = root / route_slug
    target_dir.mkdir(parents=True, exist_ok=True)
    (target_dir / "index.html").write_text(page_html, encoding="utf-8")
    return True


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    blog_root = repo_root / "blog"
    gv_blog_root = repo_root / "goingvegan" / "blog"
    blog_root.mkdir(parents=True, exist_ok=True)
    gv_blog_root.mkdir(parents=True, exist_ok=True)

    posts = fetch_posts()

    seen_original_slugs: set[str] = set()
    expected_blog_slugs: set[str] = set()
    expected_gv_slugs: set[str] = set()
    used_blog_slugs: set[str] = set()
    used_gv_slugs: set[str] = set()
    generated = 0

    for post in posts:
        original_slug = clean_slug(post.get("slug"))
        if not original_slug or original_slug in seen_original_slugs:
            continue
        seen_original_slugs.add(original_slug)

        canonical_slug = strip_hash_suffix(original_slug)
        if not canonical_slug:
            continue

        route_slugs = [canonical_slug]
        if original_slug != canonical_slug:
            route_slugs.append(original_slug)

        is_gv = is_goingvegan_post(post, canonical_slug)
        canonical_base = "/goingvegan/blog" if is_gv else "/blog"
        og_image = resolve_og_image_url(repo_root, original_slug)

        for route_slug in route_slugs:
            page_for_main_blog = build_page(
                route_slug=route_slug,
                canonical_slug=canonical_slug,
                canonical_base=canonical_base,
                title=str(post.get("title") or ""),
                summary=safe_summary(post.get("summary") or ""),
                published_at=str(post.get("published_at") or ""),
                og_image_url=og_image,
                page_title_suffix="Live Blog | Kevin Armstrong",
                asset_prefix="../../",
                module_src=f"../blog.js?v={SCRIPT_VERSION}",
                nav_home_href="/",
                nav_list_href="/#blog",
                nav_list_label="Live Blog",
                back_href="/#blog",
                back_label="Back to Live Blog",
                noscript_href_base="/blog/",
            )
            if write_route_page(
                root=blog_root,
                route_slug=route_slug,
                used_slugs=used_blog_slugs,
                expected_slugs=expected_blog_slugs,
                page_html=page_for_main_blog,
            ):
                generated += 1

            if is_gv:
                page_for_gv_blog = build_page(
                    route_slug=route_slug,
                    canonical_slug=canonical_slug,
                    canonical_base="/goingvegan/blog",
                    title=str(post.get("title") or ""),
                    summary=safe_summary(post.get("summary") or ""),
                    published_at=str(post.get("published_at") or ""),
                    og_image_url=og_image,
                    page_title_suffix="GoingVegan Blog | Kevin Armstrong",
                    asset_prefix="../../../",
                    module_src=f"../../../blog/blog.js?v={SCRIPT_VERSION}",
                    nav_home_href="/goingvegan/",
                    nav_list_href="/goingvegan/#gv-blog",
                    nav_list_label="GoingVegan Blog",
                    back_href="/goingvegan/#gv-blog",
                    back_label="Back to GoingVegan Blog",
                    noscript_href_base="/goingvegan/blog/",
                )
                if write_route_page(
                    root=gv_blog_root,
                    route_slug=route_slug,
                    used_slugs=used_gv_slugs,
                    expected_slugs=expected_gv_slugs,
                    page_html=page_for_gv_blog,
                ):
                    generated += 1

    remove_stale_generated_dirs(blog_root, expected_blog_slugs)
    remove_stale_generated_dirs(gv_blog_root, expected_gv_slugs)
    print(f"Generated {generated} static blog slug routes")


if __name__ == "__main__":
    main()
