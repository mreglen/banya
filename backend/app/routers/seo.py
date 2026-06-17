import os
from datetime import date
from typing import Optional
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Bath, Category

router = APIRouter(tags=["seo"])

SITE_URL = os.getenv("SITE_URL", "https://nikolaevskie.ru").rstrip("/")


def _url_entry(path: str, changefreq: str, priority: str, lastmod: Optional[str] = None) -> str:
    loc = f"{SITE_URL}{path}"
    mod = lastmod or date.today().isoformat()
    return (
        "  <url>\n"
        f"    <loc>{escape(loc)}</loc>\n"
        f"    <lastmod>{mod}</lastmod>\n"
        f"    <changefreq>{changefreq}</changefreq>\n"
        f"    <priority>{priority}</priority>\n"
        "  </url>"
    )


@router.get("/sitemap.xml")
def sitemap_xml(db: Session = Depends(get_db)):
    entries = [
        _url_entry("/", "weekly", "1.0"),
        _url_entry("/baths", "weekly", "0.9"),
        _url_entry("/booking", "monthly", "0.8"),
    ]

    baths = db.query(Bath).filter(Bath.slug.isnot(None), Bath.slug != "").all()
    for bath in baths:
        entries.append(_url_entry(f"/baths/{bath.slug}", "weekly", "0.8"))

    categories = (
        db.query(Category)
        .options(joinedload(Category.products))
        .filter(Category.is_visible_on_website.is_(True))
        .order_by(Category.id.asc())
        .all()
    )

    for category in categories:
        visible_products = [
            p for p in (category.products or [])
            if p.is_visible_on_website
        ]
        if not visible_products:
            continue
        entries.append(
            _url_entry(f"/categories/{category.id}/products", "weekly", "0.7")
        )

    xml_body = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(entries)
        + "\n</urlset>"
    )

    return Response(content=xml_body, media_type="application/xml")
