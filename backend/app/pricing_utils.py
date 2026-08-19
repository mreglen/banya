"""Расчёт стоимости бани по тарифам времени суток."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional, Tuple, List, Dict

SEGMENT_MINUTES = 30


def _parse_hm(hm: str) -> int:
    parts = hm.split(":")
    if len(parts) != 2:
        raise ValueError(f"Неверный формат времени: {hm}")
    hour, minute = int(parts[0]), int(parts[1])
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise ValueError(f"Неверное время: {hm}")
    return hour * 60 + minute


def _format_hm(minutes: int) -> str:
    minutes = minutes % (24 * 60)
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def is_weekend(dt: datetime) -> bool:
    return dt.weekday() >= 4


def _time_in_interval(minutes: int, from_hm: str, to_hm: str) -> bool:
    from_m = _parse_hm(from_hm)
    to_m = _parse_hm(to_hm)
    if from_m < to_m:
        return from_m <= minutes < to_m
    return minutes >= from_m or minutes < to_m


def _get_slots(bath, is_weekend_day: bool) -> List[Dict[str, Any]]:
    tariffs = getattr(bath, "time_tariffs", None) or {}
    if isinstance(tariffs, dict):
        key = "weekend" if is_weekend_day else "weekday"
        slots = tariffs.get(key) or []
        if slots:
            return slots
    price = int(bath.cost_weekend if is_weekend_day else bath.cost_weekday)
    return [{"from": "00:00", "to": "00:00", "price": price}]


def _price_for_datetime(bath, dt: datetime) -> int:
    is_wknd = is_weekend(dt)
    slots = _get_slots(bath, is_wknd)
    if len(slots) == 1 and slots[0].get("from") == "00:00" and slots[0].get("to") == "00:00":
        return int(slots[0]["price"])
    minutes = dt.hour * 60 + dt.minute
    for slot in slots:
        if _time_in_interval(minutes, slot["from"], slot["to"]):
            return int(slot["price"])
    return int(bath.cost_weekend if is_wknd else bath.cost_weekday)


def calculate_bath_base_cost(
    bath,
    start_dt: datetime,
    end_dt: datetime,
    hourly_rate_override: Optional[int] = None,
) -> Tuple[int, int]:
    """Возвращает (bath_base_cost, effective_hourly_rate)."""
    paid_hours = (end_dt - start_dt).total_seconds() / 3600
    if paid_hours <= 0:
        return 0, 0

    if hourly_rate_override is not None:
        cost = int(round(hourly_rate_override * paid_hours))
        return cost, int(hourly_rate_override)

    total_cost = 0.0
    segment = timedelta(minutes=SEGMENT_MINUTES)
    current = start_dt
    while current < end_dt:
        segment_end = min(current + segment, end_dt)
        segment_hours = (segment_end - current).total_seconds() / 3600
        price_per_hour = _price_for_datetime(bath, current)
        total_cost += price_per_hour * segment_hours
        current = segment_end

    effective_rate = int(round(total_cost / paid_hours)) if paid_hours > 0 else 0
    return int(round(total_cost)), effective_rate


def _validate_hm(value: str, field_name: str) -> None:
    try:
        _parse_hm(value)
    except ValueError as exc:
        raise ValueError(f"{field_name}: {exc}") from exc


def _validate_intervals_cover_day(slots: List[Dict[str, Any]], label: str) -> None:
    if not slots:
        return
    for idx, slot in enumerate(slots):
        if "from" not in slot or "to" not in slot or "price" not in slot:
            raise ValueError(f"{label}: интервал #{idx + 1} должен содержать from, to и price")
        _validate_hm(slot["from"], f"{label}, интервал #{idx + 1}, from")
        _validate_hm(slot["to"], f"{label}, интервал #{idx + 1}, to")
        if int(slot["price"]) <= 0:
            raise ValueError(f"{label}: цена в интервале #{idx + 1} должна быть больше 0")

    for minutes in range(0, 24 * 60, SEGMENT_MINUTES):
        matches = [s for s in slots if _time_in_interval(minutes, s["from"], s["to"])]
        if len(matches) != 1:
            time_label = _format_hm(minutes)
            raise ValueError(
                f"{label}: время {time_label} должно попадать ровно в один интервал "
                f"(найдено: {len(matches)})"
            )


def validate_time_tariffs(time_tariffs: Optional[dict]) -> None:
    if not time_tariffs:
        return
    if not isinstance(time_tariffs, dict):
        raise ValueError("time_tariffs должен быть объектом")
    for key in ("weekday", "weekend"):
        if key not in time_tariffs:
            continue
        slots = time_tariffs.get(key) or []
        if not isinstance(slots, list):
            raise ValueError(f"time_tariffs.{key} должен быть массивом")
        _validate_intervals_cover_day(slots, "Будни" if key == "weekday" else "Выходные")


def daytime_price_from_slots(slots: List[Dict[str, Any]]) -> Optional[int]:
    if not slots:
        return None
    daytime = [s for s in slots if _parse_hm(s["from"]) < _parse_hm(s["to"])]
    if not daytime:
        return None
    preferred = next((s for s in daytime if s["from"] == "08:00"), daytime[0])
    return int(preferred["price"])


def sync_flat_costs_from_tariffs(
    time_tariffs: Optional[dict],
    cost_weekday: int,
    cost_weekend: int,
) -> Tuple[int, int]:
    if not time_tariffs or not isinstance(time_tariffs, dict):
        return cost_weekday, cost_weekend
    wd = daytime_price_from_slots(time_tariffs.get("weekday") or []) or cost_weekday
    we = daytime_price_from_slots(time_tariffs.get("weekend") or []) or cost_weekend
    return wd, we


def legacy_hourly_rate(bath, start_dt: datetime) -> int:
    return int(bath.cost_weekend if is_weekend(start_dt) else bath.cost_weekday)
