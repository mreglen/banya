"""Helpers for product price from purchase cost and global markup %."""
from sqlalchemy.orm import Session

from app import models


def get_markup_percent(db: Session) -> float:
    row = (
        db.query(models.Settings)
        .filter(models.Settings.key == "markup_percent")
        .first()
    )
    if row is not None and row.value is not None:
        return float(row.value)
    return 0.0


def price_from_purchase(purchase_price: float, markup_percent: float) -> float:
    return round(float(purchase_price or 0) * (1 + float(markup_percent or 0) / 100.0), 2)
