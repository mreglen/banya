"""Применение акций бани к бронированию."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session, joinedload

from app import models


def _promo_matches(
    promo: models.Promotion,
    *,
    duration_hours: float,
    guests: int,
    bath_cost: float,
    start_dt: datetime,
) -> bool:
    if not promo.is_active:
        return False

    booking_date = start_dt.date() if hasattr(start_dt, "date") else start_dt

    if promo.valid_from and booking_date < promo.valid_from:
        return False
    if promo.valid_until and booking_date > promo.valid_until:
        return False

    if promo.min_hours is not None and duration_hours + 1e-9 < float(promo.min_hours):
        return False
    if promo.min_guests is not None and guests < int(promo.min_guests):
        return False
    if promo.min_amount is not None and bath_cost + 1e-9 < float(promo.min_amount):
        return False

    if promo.applicable_weekdays:
        weekday = start_dt.weekday()  # 0=пн … 6=вс
        if weekday not in promo.applicable_weekdays:
            return False

    return True


def _promo_score(promo: models.Promotion) -> Tuple[int, int]:
    gifts = len(promo.gift_products or [])
    bonus = int(promo.bonus_minutes or 0)
    return (bonus, gifts)


def build_promotion_snapshot(promo: models.Promotion) -> Dict[str, Any]:
    gift_products = []
    for gp in promo.gift_products or []:
        product = gp.product
        gift_products.append({
            "product_id": gp.product_id,
            "product_name": product.name if product else f"#{gp.product_id}",
            "quantity": gp.quantity,
        })
    return {
        "id": promo.id,
        "name": promo.name,
        "description": promo.description,
        "min_hours": promo.min_hours,
        "min_guests": promo.min_guests,
        "min_amount": promo.min_amount,
        "bonus_minutes": promo.bonus_minutes,
        "gift_products": gift_products,
    }


def find_applicable_promotion(
    db: Session,
    bath_id: int,
    *,
    duration_hours: float,
    guests: int,
    bath_cost: float,
    start_dt: datetime,
) -> Optional[models.Promotion]:
    promos = (
        db.query(models.Promotion)
        .join(models.BathPromotion)
        .options(
            joinedload(models.Promotion.gift_products).joinedload(
                models.PromotionGiftProduct.product
            )
        )
        .filter(
            models.BathPromotion.bath_id == bath_id,
            models.Promotion.is_active.is_(True),
        )
        .all()
    )

    matched = [
        p
        for p in promos
        if _promo_matches(
            p,
            duration_hours=duration_hours,
            guests=guests,
            bath_cost=bath_cost,
            start_dt=start_dt,
        )
    ]
    if not matched:
        return None

    matched.sort(key=_promo_score, reverse=True)
    return matched[0]


def apply_promotion_to_reservation(
    db: Session,
    bath: models.Bath,
    *,
    start_dt: datetime,
    end_dt: datetime,
    guests: int,
    bath_cost: float,
    products: List[Any],
) -> Tuple[datetime, Optional[models.Promotion], Optional[Dict[str, Any]], List[Any]]:
    """
    Возвращает (end_dt с бонусом, promo, snapshot, products с подарочными позициями).
    Стоимость бани уже посчитана по оплачиваемой длительности (без бонуса).
    """
    duration_hours = (end_dt - start_dt).total_seconds() / 3600.0
    promo = find_applicable_promotion(
        db,
        bath.bath_id,
        duration_hours=duration_hours,
        guests=guests,
        bath_cost=bath_cost,
        start_dt=start_dt,
    )
    if not promo:
        return end_dt, None, None, list(products or [])

    snapshot = build_promotion_snapshot(promo)
    new_end = end_dt
    if promo.bonus_minutes:
        new_end = end_dt + timedelta(minutes=int(promo.bonus_minutes))

    merged = list(products or [])
    from types import SimpleNamespace

    for gp in promo.gift_products or []:
        merged.append(
            SimpleNamespace(
                product_id=int(gp.product_id),
                quantity=int(gp.quantity or 1),
                price=0.0,
                is_gift=True,
            )
        )

    return new_end, promo, snapshot, merged


def serialize_promotion_brief(promo: models.Promotion) -> Dict[str, Any]:
    gift_products = []
    for gp in promo.gift_products or []:
        product = gp.product
        gift_products.append({
            "product_id": gp.product_id,
            "product_name": product.name if product else f"#{gp.product_id}",
            "quantity": gp.quantity,
        })
    return {
        "id": promo.id,
        "name": promo.name,
        "description": promo.description,
        "is_active": promo.is_active,
        "min_hours": promo.min_hours,
        "min_guests": promo.min_guests,
        "min_amount": promo.min_amount,
        "applicable_weekdays": promo.applicable_weekdays,
        "bonus_minutes": promo.bonus_minutes,
        "valid_from": promo.valid_from,
        "valid_until": promo.valid_until,
        "gift_products": gift_products,
    }
