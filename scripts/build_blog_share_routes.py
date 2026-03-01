#!/usr/bin/env python3
"""Generate static blog slug route stubs for social scrapers.

Each generated page returns HTTP 200 at /blog/<slug>/ so bots like LinkedIn
can resolve the URL without executing JavaScript.
"""

from __future__ import annotations

import html
import json
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

SUPABASE_URL = "https://efrkjqbrfsynzdjbgqck.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_hZ74MUnNhGncPQNHdx9YAA_GThc73YP"
CANONICAL_ORIGIN = "https://kevinarmstrong.io"
MAX_POSTS = 200
GEN_MARKER = "<!-- GENERATED_BLOG_ROUTE -->"


def fetch_posts() -> list[dict]:
    endpoint = (
        f"{SUPABASE_URL}/rest/v1/posts"
        f"?select=slug,title,summary,published_at"
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


def build_page(slug: str, title: str, summary: str, published_at: str) -> str:
    slug_q = quote(slug, safe="")
    canonical_url = f"{CANONICAL_ORIGIN}/blog/{slug}"
    target = f"/blog/?slug={slug_q}&from=path"
    title_text = title or "Live Blog Article"
    desc_text = summary or "Live Blog article by Kevin Armstrong."
    published = published_at or ""

    return f"""<!doctype html>
<html lang=\"en\">
  <head>
    {GEN_MARKER}
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>{html.escape(title_text)} | Live Blog | Kevin Armstrong</title>
    <meta name=\"description\" content=\"{html.escape(desc_text)}\" />
    <link rel=\"canonical\" href=\"{html.escape(canonical_url)}\" />
    <meta property=\"og:type\" content=\"article\" />
    <meta property=\"og:title\" content=\"{html.escape(title_text)}\" />
    <meta property=\"og:description\" content=\"{html.escape(desc_text)}\" />
    <meta property=\"og:url\" content=\"{html.escape(canonical_url)}\" />
    <meta property=\"article:published_time\" content=\"{html.escape(published)}\" />
    <meta http-equiv=\"refresh\" content=\"0; url={html.escape(target)}\" />
    <script>
      window.location.replace({json.dumps(target)});
    </script>
  </head>
  <body>
    <p>Redirecting to article… <a href=\"{html.escape(target)}\">Continue</a></p>
  </body>
</html>
"""


def remove_stale_generated_dirs(blog_root: Path, expected_slugs: set[str]) -> None:
    for child in blog_root.iterdir():
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


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    blog_root = repo_root / "blog"
    blog_root.mkdir(parents=True, exist_ok=True)

    posts = fetch_posts()

    slugs: set[str] = set()
    generated = 0
    for post in posts:
        slug = clean_slug(post.get("slug"))
        if not slug:
            continue
        if slug in slugs:
            continue
        slugs.add(slug)

        target_dir = blog_root / slug
        target_dir.mkdir(parents=True, exist_ok=True)

        page = build_page(
            slug=slug,
            title=str(post.get("title") or ""),
            summary=safe_summary(post.get("summary") or ""),
            published_at=str(post.get("published_at") or ""),
        )
        (target_dir / "index.html").write_text(page, encoding="utf-8")
        generated += 1

    remove_stale_generated_dirs(blog_root, slugs)
    print(f"Generated {generated} static blog slug routes")


if __name__ == "__main__":
    main()
