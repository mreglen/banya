"""Применение акций бани к бронированию."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Set, Tuple

from sqlalchemy.orm import Session, joinedload

from app import models


def _normalize_weekday(day: int) -> int:
    """API/UI: 1=пн … 7=вс → Python: 0=пн … 6=вс."""
    if day == 7:
        return 6
    if 1 <= day <= 6:
        return day - 1
    return day


def _weekday_matches(promo: models.Promotion, start_dt: datetime) -> bool:
    if not promo.applicable_weekdays:
        return True
    weekday = start_dt.weekday()
    normalized = {_normalize_weekday(int(d)) for d in promo.applicable_weekdays}
    return weekday in normalized


def _is_birthday_promotion(promo: models.Promotion) -> bool:
    return getattr(promo, "promotion_type", None) == "birthday"


def calculate_promotions_discount(promos: List[models.Promotion], bath_cost: float) -> int:
    total = 0
    bath_cost_int = max(0, int(bath_cost))
    for promo in promos:
        if promo.discount_amount:
            total += int(promo.discount_amount)
        if promo.discount_percent:
            total += int(bath_cost_int * float(promo.discount_percent) / 100)
    return min(total, bath_cost_int)


def get_snapshot_discount(snapshot: Optional[Dict[str, Any]]) -> int:
    normalized = normalize_promotion_snapshot(snapshot)
    return int(normalized.get("discount_amount") or 0)


def get_promo_mismatch_reasons(
    promo: models.Promotion,
    *,
    duration_hours: float,
    guests: int,
    bath_cost: float,
    start_dt: datetime,
) -> List[str]:
    reasons: List[str] = []
    if not promo.is_active:
        reasons.append("акция неактивна")

    booking_date = start_dt.date() if hasattr(start_dt, "date") else start_dt
    if promo.valid_from and booking_date < promo.valid_from:
        reasons.append(f"действует с {promo.valid_from.strftime('%d.%m.%Y')}")
    if promo.valid_until and booking_date > promo.valid_until:
        reasons.append(f"действует до {promo.valid_until.strftime('%d.%m.%Y')}")
    if promo.min_hours is not None and duration_hours + 1e-9 < float(promo.min_hours):
        reasons.append(f"минимум {promo.min_hours} ч")
    if promo.min_guests is not None and guests < int(promo.min_guests):
        reasons.append(f"минимум {promo.min_guests} гостей")
    if promo.min_amount is not None and bath_cost + 1e-9 < float(promo.min_amount):
        reasons.append(f"минимум {int(promo.min_amount)} ₽ за баню")
    if promo.applicable_weekdays and not _weekday_matches(promo, start_dt):
        reasons.append("не подходит день недели")
    return reasons


def _promo_matches(
    promo: models.Promotion,
    *,
    duration_hours: float,
    guests: int,
    bath_cost: float,
    start_dt: datetime,
) -> bool:
    return len(get_promo_mismatch_reasons(
        promo,
        duration_hours=duration_hours,
        guests=guests,
        bath_cost=bath_cost,
        start_dt=start_dt,
    )) == 0


def _canonical_pair(a: int, b: int) -> Tuple[int, int]:
    return (a, b) if a < b else (b, a)


def load_incompatibility_map(
    db: Session,
    promotion_ids: Optional[List[int]] = None,
) -> Dict[int, Set[int]]:
    query = db.query(models.PromotionIncompatibility)
    if promotion_ids:
        ids = set(int(i) for i in promotion_ids)
        query = query.filter(
            models.PromotionIncompatibility.promotion_id_a.in_(ids)
            | models.PromotionIncompatibility.promotion_id_b.in_(ids)
        )
    result: Dict[int, Set[int]] = {}
    for row in query.all():
        a, b = int(row.promotion_id_a), int(row.promotion_id_b)
        result.setdefault(a, set()).add(b)
        result.setdefault(b, set()).add(a)
    return result


def are_promotions_incompatible(
    incompatibility_map: Dict[int, Set[int]],
    promo_id_a: int,
    promo_id_b: int,
) -> bool:
    if promo_id_a == promo_id_b:
        return False
    return promo_id_b in incompatibility_map.get(promo_id_a, set())


def get_incompatible_promotion_ids(db: Session, promotion_id: int) -> List[int]:
    mapping = load_incompatibility_map(db, [promotion_id])
    return sorted(mapping.get(int(promotion_id), set()))


def set_promotion_incompatibilities(
    db: Session,
    promotion_id: int,
    incompatible_ids: Optional[List[int]],
) -> None:
    promotion_id = int(promotion_id)
    db.query(models.PromotionIncompatibility).filter(
        (models.PromotionIncompatibility.promotion_id_a == promotion_id)
        | (models.PromotionIncompatibility.promotion_id_b == promotion_id)
    ).delete(synchronize_session=False)

    if not incompatible_ids:
        return

    existing_ids = {
        row[0]
        for row in db.query(models.Promotion.id).filter(models.Promotion.id != promotion_id).all()
    }
    for other_id in incompatible_ids:
        other_id = int(other_id)
        if other_id == promotion_id:
            raise ValueError("Акция не может быть несовместима сама с собой")
        if other_id not in existing_ids:
            raise ValueError(f"Акция с ID {other_id} не найдена")
        a, b = _canonical_pair(promotion_id, other_id)
        db.add(models.PromotionIncompatibility(promotion_id_a=a, promotion_id_b=b))


def get_bath_promotions(db: Session, bath_id: int) -> List[models.Promotion]:
    return (
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


def compute_default_promotion_ids(
    promos: List[models.Promotion],
    incompatibility_map: Dict[int, Set[int]],
    *,
    duration_hours: float,
    guests: int,
    bath_cost: float,
    start_dt: datetime,
) -> List[int]:
    conflicting_ids: Set[int] = set()
    promo_ids = [int(p.id) for p in promos]
    for i, id_a in enumerate(promo_ids):
        for id_b in promo_ids[i + 1:]:
            if are_promotions_incompatible(incompatibility_map, id_a, id_b):
                conflicting_ids.add(id_a)
                conflicting_ids.add(id_b)

    selected: List[int] = []
    for promo in promos:
        if _is_birthday_promotion(promo):
            continue
        if int(promo.id) in conflicting_ids:
            continue
        if _promo_matches(
            promo,
            duration_hours=duration_hours,
            guests=guests,
            bath_cost=bath_cost,
            start_dt=start_dt,
        ):
            selected.append(int(promo.id))
    return selected


def validate_selected_promotion_ids(
    db: Session,
    bath_id: int,
    promotion_ids: List[int],
) -> List[models.Promotion]:
    if not promotion_ids:
        return []

    unique_ids = []
    seen = set()
    for promo_id in promotion_ids:
        promo_id = int(promo_id)
        if promo_id in seen:
            raise ValueError(f"Акция с ID {promo_id} указана несколько раз")
        seen.add(promo_id)
        unique_ids.append(promo_id)

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
            models.Promotion.id.in_(unique_ids),
        )
        .all()
    )
    promo_map = {int(p.id): p for p in promos}
    missing = [pid for pid in unique_ids if pid not in promo_map]
    if missing:
        raise ValueError(f"Акции не привязаны к бане или не найдены: {', '.join(map(str, missing))}")

    inactive = [pid for pid in unique_ids if not promo_map[pid].is_active]
    if inactive:
        raise ValueError(f"Неактивные акции нельзя применить: {', '.join(map(str, inactive))}")

    incompatibility_map = load_incompatibility_map(db, unique_ids)
    for i, id_a in enumerate(unique_ids):
        for id_b in unique_ids[i + 1:]:
            if are_promotions_incompatible(incompatibility_map, id_a, id_b):
                name_a = promo_map[id_a].name
                name_b = promo_map[id_b].name
                raise ValueError(f"Акции «{name_a}» и «{name_b}» нельзя применять вместе")

    return [promo_map[pid] for pid in unique_ids]


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
        "promotion_type": getattr(promo, "promotion_type", None) or "standard",
        "birthday_window_days": promo.birthday_window_days,
        "reward_mode": promo.reward_mode,
        "min_hours": promo.min_hours,
        "min_guests": promo.min_guests,
        "min_amount": promo.min_amount,
        "bonus_minutes": promo.bonus_minutes,
        "discount_percent": promo.discount_percent,
        "discount_amount": promo.discount_amount,
        "gift_products": gift_products,
    }


def build_combined_promotion_snapshot(
    promos: List[models.Promotion],
    *,
    bath_cost: float = 0,
) -> Optional[Dict[str, Any]]:
    if not promos:
        return None

    promo_snapshots = [build_promotion_snapshot(p) for p in promos]
    bonus_minutes = sum(int(p.bonus_minutes or 0) for p in promos)
    gift_map: Dict[int, Dict[str, Any]] = {}
    for promo in promos:
        for gp in promo.gift_products or []:
            product = gp.product
            product_id = int(gp.product_id)
            quantity = int(gp.quantity or 1)
            if product_id in gift_map:
                gift_map[product_id]["quantity"] += quantity
            else:
                gift_map[product_id] = {
                    "product_id": product_id,
                    "product_name": product.name if product else f"#{product_id}",
                    "quantity": quantity,
                }

    primary = promo_snapshots[0]
    names = ", ".join(p["name"] for p in promo_snapshots)
    discount_amount = calculate_promotions_discount(promos, bath_cost)
    return {
        "id": primary["id"],
        "name": names,
        "description": primary.get("description"),
        "bonus_minutes": bonus_minutes,
        "discount_amount": discount_amount,
        "gift_products": list(gift_map.values()),
        "promotions": promo_snapshots,
    }


def normalize_promotion_snapshot(snapshot: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not snapshot:
        return {"promotions": [], "bonus_minutes": 0, "gift_products": [], "discount_amount": 0}
    if isinstance(snapshot.get("promotions"), list):
        if snapshot.get("discount_amount") is None:
            snapshot = {**snapshot, "discount_amount": 0}
        return snapshot
    return {
        "promotions": [snapshot],
        "bonus_minutes": int(snapshot.get("bonus_minutes") or 0),
        "discount_amount": int(snapshot.get("discount_amount") or 0),
        "gift_products": snapshot.get("gift_products") or [],
        "id": snapshot.get("id"),
        "name": snapshot.get("name"),
    }


def get_snapshot_gift_product_ids(snapshot: Optional[Dict[str, Any]]) -> Set[int]:
    normalized = normalize_promotion_snapshot(snapshot)
    return {int(g["product_id"]) for g in normalized.get("gift_products", []) if g.get("product_id") is not None}


def get_snapshot_promotion_ids(snapshot: Optional[Dict[str, Any]], applied_promotion_ids=None) -> List[int]:
    if applied_promotion_ids:
        return [int(x) for x in applied_promotion_ids]
    normalized = normalize_promotion_snapshot(snapshot)
    ids = []
    for promo in normalized.get("promotions", []):
        if promo.get("id") is not None:
            ids.append(int(promo["id"]))
    if not ids and normalized.get("id") is not None:
        ids.append(int(normalized["id"]))
    return ids


def apply_selected_promotions_to_reservation(
    db: Session,
    bath: models.Bath,
    *,
    start_dt: datetime,
    end_dt: datetime,
    guests: int,
    bath_cost: float,
    products: List[Any],
    promotion_ids: Optional[List[int]] = None,
) -> Tuple[datetime, List[models.Promotion], Optional[Dict[str, Any]], List[Any]]:
    duration_hours = (end_dt - start_dt).total_seconds() / 3600.0

    if promotion_ids is None:
        promos = get_bath_promotions(db, bath.bath_id)
        incompatibility_map = load_incompatibility_map(db, [p.id for p in promos])
        promotion_ids = compute_default_promotion_ids(
            promos,
            incompatibility_map,
            duration_hours=duration_hours,
            guests=guests,
            bath_cost=bath_cost,
            start_dt=start_dt,
        )

    selected_promos = validate_selected_promotion_ids(db, bath.bath_id, promotion_ids or [])
    if not selected_promos:
        return end_dt, [], None, list(products or [])

    snapshot = build_combined_promotion_snapshot(selected_promos, bath_cost=bath_cost)
    bonus_minutes = int(snapshot.get("bonus_minutes") or 0) if snapshot else 0
    new_end = end_dt + timedelta(minutes=bonus_minutes) if bonus_minutes else end_dt

    merged = list(products or [])
    from types import SimpleNamespace

    for gp_data in (snapshot or {}).get("gift_products", []):
        merged.append(
            SimpleNamespace(
                product_id=int(gp_data["product_id"]),
                quantity=int(gp_data.get("quantity") or 1),
                price=0.0,
                is_gift=True,
            )
        )

    return new_end, selected_promos, snapshot, merged


def apply_promotion_to_reservation(
    db: Session,
    bath: models.Bath,
    *,
    start_dt: datetime,
    end_dt: datetime,
    guests: int,
    bath_cost: float,
    products: List[Any],
    promotion_ids: Optional[List[int]] = None,
) -> Tuple[datetime, Optional[models.Promotion], Optional[Dict[str, Any]], List[Any]]:
    """Обратно совместимая обёртка: возвращает первую акцию."""
    new_end, promos, snapshot, merged = apply_selected_promotions_to_reservation(
        db,
        bath,
        start_dt=start_dt,
        end_dt=end_dt,
        guests=guests,
        bath_cost=bath_cost,
        products=products,
        promotion_ids=promotion_ids,
    )
    return new_end, promos[0] if promos else None, snapshot, merged


def find_applicable_promotion(
    db: Session,
    bath_id: int,
    *,
    duration_hours: float,
    guests: int,
    bath_cost: float,
    start_dt: datetime,
) -> Optional[models.Promotion]:
    promos = get_bath_promotions(db, bath_id)
    incompatibility_map = load_incompatibility_map(db, [p.id for p in promos])
    ids = compute_default_promotion_ids(
        promos,
        incompatibility_map,
        duration_hours=duration_hours,
        guests=guests,
        bath_cost=bath_cost,
        start_dt=start_dt,
    )
    if not ids:
        return None
    promo_map = {int(p.id): p for p in promos}
    return promo_map.get(ids[0])


def serialize_promotion_brief(
    promo: models.Promotion,
    *,
    incompatible_promotion_ids: Optional[List[int]] = None,
) -> Dict[str, Any]:
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
        "promotion_type": getattr(promo, "promotion_type", None) or "standard",
        "birthday_window_days": promo.birthday_window_days,
        "reward_mode": promo.reward_mode,
        "min_hours": promo.min_hours,
        "min_guests": promo.min_guests,
        "min_amount": promo.min_amount,
        "applicable_weekdays": promo.applicable_weekdays,
        "bonus_minutes": promo.bonus_minutes,
        "discount_percent": promo.discount_percent,
        "discount_amount": promo.discount_amount,
        "valid_from": promo.valid_from,
        "valid_until": promo.valid_until,
        "gift_products": gift_products,
        "incompatible_promotion_ids": incompatible_promotion_ids or [],
    }
