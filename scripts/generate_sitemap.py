#!/usr/bin/env python3
"""Generate sitemap.xml for kevinarmstrong.io."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import re
import xml.etree.ElementTree as ET

CANONICAL_ORIGIN = "https://kevinarmstrong.io"
URLSET_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"


def iso_date(ts: float) -> str:
    return datetime.fromtimestamp(ts, timezone.utc).date().isoformat()


def add_url(urlset: ET.Element, loc: str, lastmod: str, priority: str) -> None:
    url_el = ET.SubElement(urlset, "url")
    ET.SubElement(url_el, "loc").text = loc
    ET.SubElement(url_el, "lastmod").text = lastmod
    ET.SubElement(url_el, "changefreq").text = "weekly"
    ET.SubElement(url_el, "priority").text = priority


def collect_urls(repo_root: Path) -> list[tuple[str, str, str]]:
    routes: list[tuple[str, str, str]] = []

    def file_lastmod(path: Path) -> str:
        return iso_date(path.stat().st_mtime)

    static_routes = [
        ("/", repo_root / "index.html", "1.0"),
        ("/blog/", repo_root / "blog" / "index.html", "0.9"),
        ("/terms-and-conditions/", repo_root / "terms-and-conditions" / "index.html", "0.5"),
    ]

    for route, path, priority in static_routes:
        if path.exists():
            routes.append((route, file_lastmod(path), priority))

    blog_root = repo_root / "blog"
    if blog_root.exists():
        canonical_blog_routes: dict[str, tuple[str, str]] = {}
        for child in sorted(blog_root.iterdir()):
            if not child.is_dir() or child.name == "assets":
                continue
            idx = child / "index.html"
            if not idx.exists():
                continue
            canonical_slug = re.sub(r"-[a-f0-9]{8}$", "", child.name, flags=re.IGNORECASE)
            route = f"/blog/{canonical_slug}/"
            lastmod = file_lastmod(idx)
            existing = canonical_blog_routes.get(route)
            if existing is None or lastmod > existing[0]:
                canonical_blog_routes[route] = (lastmod, "0.8")
        routes.extend((route, lastmod, priority) for route, (lastmod, priority) in canonical_blog_routes.items())

    # dedupe by route while preserving first occurrence
    deduped = {}
    for route, lastmod, priority in routes:
        deduped.setdefault(route, (lastmod, priority))

    return [(route, *values) for route, values in deduped.items()]


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    output = repo_root / "sitemap.xml"

    ET.register_namespace("", URLSET_NS)
    urlset = ET.Element(ET.QName(URLSET_NS, "urlset"))

    for route, lastmod, priority in collect_urls(repo_root):
        loc = f"{CANONICAL_ORIGIN}{route}"
        add_url(urlset, loc, lastmod, priority)

    tree = ET.ElementTree(urlset)
    tree.write(output, encoding="utf-8", xml_declaration=True)
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
