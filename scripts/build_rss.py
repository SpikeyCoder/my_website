#!/usr/bin/env python3
import json
from pathlib import Path
import time
import html
import re
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from urllib.request import urlopen, Request
import xml.etree.ElementTree as ET

OPML_URL = "https://gist.githubusercontent.com/emschwartz/e6d2bf860ccc367fe37ff953ba6de66b/raw/hn-popular-blogs-2025.opml"
MAX_FEEDS = 36
MAX_ITEMS = 40
ITEMS_PER_FEED = 3


def fetch_text(url: str) -> str:
    req = Request(url, headers={"User-Agent": "RSS Builder/1.0"})
    with urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def parse_opml(text: str):
    root = ET.fromstring(text)
    feeds = []
    for node in root.findall(".//outline"):
        xml_url = node.attrib.get("xmlUrl")
        title = node.attrib.get("title") or node.attrib.get("text")
        if xml_url:
            feeds.append({"title": title or "Feed", "url": xml_url})
    return feeds


def strip_html(value: str) -> str:
    clean = re.sub(r"<[^>]+>", " ", value or "")
    clean = html.unescape(clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


def parse_rss(text: str, source: str):
    items = []
    try:
        root = ET.fromstring(text)
    except ET.ParseError:
        return items

    for item in root.findall(".//item"):
        title = (item.findtext("title") or "Untitled").strip()
        link = (item.findtext("link") or "").strip()
        pub_date = (item.findtext("pubDate") or "").strip()
        summary = item.findtext("description") or ""
        items.append({
            "title": title,
            "link": link,
            "date": pub_date,
            "summary": strip_html(summary),
            "source": source,
        })

    for entry in root.findall(".//{http://www.w3.org/2005/Atom}entry"):
        title = (entry.findtext("{http://www.w3.org/2005/Atom}title") or "Untitled").strip()
        link_el = entry.find("{http://www.w3.org/2005/Atom}link")
        link = link_el.attrib.get("href", "") if link_el is not None else ""
        updated = (entry.findtext("{http://www.w3.org/2005/Atom}updated") or "").strip()
        summary = entry.findtext("{http://www.w3.org/2005/Atom}summary") or ""
        items.append({
            "title": title,
            "link": link,
            "date": updated,
            "summary": strip_html(summary),
            "source": source,
        })

    return items


def parse_date(value: str):
    if not value:
        return None
    value = value.strip()
    # RSS pubDate is often RFC 2822.
    try:
        dt = parsedate_to_datetime(value)
        if dt is not None:
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
    except Exception:
        pass
    # Atom updated is often ISO 8601.
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None


def date_value(item):
    dt = parse_date(item.get("date", ""))
    if dt is None:
        return 0
    return dt.timestamp()




def update_index_seed(items):
    index_path = Path("index.html")
    if not index_path.exists():
        return
    content = index_path.read_text(encoding="utf-8")
    start = "<!-- RSS_SEED_START -->"
    end = "<!-- RSS_SEED_END -->"
    if start not in content or end not in content:
        return
    seed_json = json.dumps(items, ensure_ascii=False)
    block = (
        start
        + "\n"
        + '<script type="application/json" id="rss-seed">'
        + seed_json
        + "</script>\n"
        + end
    )
    before = content.split(start)[0]
    after = content.split(end)[1]
    index_path.write_text(before + block + after, encoding="utf-8")


def main():

    opml_text = fetch_text(OPML_URL)
    feeds = parse_opml(opml_text)[:MAX_FEEDS]
    results = []

    for feed in feeds:
        try:
            feed_text = fetch_text(feed["url"])
            items = parse_rss(feed_text, feed["title"])[:ITEMS_PER_FEED]
            results.extend(items)
        except Exception:
            continue

    # Normalize dates so the client can reliably sort and display newest first.
    for item in results:
        dt = parse_date(item.get("date", ""))
        if dt is None:
            continue
        item["date"] = dt.isoformat().replace("+00:00", "Z")

    results.sort(key=date_value, reverse=True)
    results = [item for item in results if item.get("link")][:MAX_ITEMS]

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "items": results,
    }

    with open("rss.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    update_index_seed(results)


if __name__ == "__main__":
    main()
