const formatLocalYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const normalizeWeekday = (day) => {
  const value = Number(day);
  if (value === 7) return 6;
  if (value >= 1 && value <= 6) return value - 1;
  return value;
};

export const getPromoMismatchReasons = ({
  promo,
  durationHours,
  guests,
  bathCost,
  startDate,
}) => {
  const reasons = [];
  if (!promo || promo.is_active === false) {
    reasons.push('акция неактивна');
  }

  const bookingDate = formatLocalYmd(startDate);
  if (promo.valid_from && bookingDate < promo.valid_from) {
    reasons.push(`действует с ${new Date(`${promo.valid_from}T12:00:00`).toLocaleDateString('ru-RU')}`);
  }
  if (promo.valid_until && bookingDate > promo.valid_until) {
    reasons.push(`действует до ${new Date(`${promo.valid_until}T12:00:00`).toLocaleDateString('ru-RU')}`);
  }
  if (promo.min_hours != null && durationHours + 1e-9 < Number(promo.min_hours)) {
    reasons.push(`минимум ${promo.min_hours} ч`);
  }
  if (promo.min_guests != null && guests < Number(promo.min_guests)) {
    reasons.push(`минимум ${promo.min_guests} гостей`);
  }
  if (promo.min_amount != null && bathCost + 1e-9 < Number(promo.min_amount)) {
    reasons.push(`минимум ${Math.round(Number(promo.min_amount)).toLocaleString('ru-RU')} ₽ за баню`);
  }
  if (Array.isArray(promo.applicable_weekdays) && promo.applicable_weekdays.length > 0) {
    const weekday = (startDate.getDay() + 6) % 7;
    const normalized = promo.applicable_weekdays.map(normalizeWeekday);
    if (!normalized.includes(weekday)) {
      reasons.push('не подходит день недели');
    }
  }
  return reasons;
};

export const promoMatches = (params) => getPromoMismatchReasons(params).length === 0;

export const arePromotionsIncompatible = (promoA, promoB) => {
  if (!promoA || !promoB) return false;
  if (Number(promoA.id) === Number(promoB.id)) return true;
  const idsA = new Set((promoA.incompatible_promotion_ids || []).map(Number));
  const idsB = new Set((promoB.incompatible_promotion_ids || []).map(Number));
  return idsA.has(Number(promoB.id)) || idsB.has(Number(promoA.id));
};

export const computeDefaultPromotionIds = ({
  promos,
  durationHours,
  guests,
  bathCost,
  startDate,
}) => {
  const list = (promos || []).filter((p) => p && p.is_active !== false);
  const conflictingIds = new Set();

  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      if (arePromotionsIncompatible(list[i], list[j])) {
        conflictingIds.add(Number(list[i].id));
        conflictingIds.add(Number(list[j].id));
      }
    }
  }

  return list
    .filter((promo) => !conflictingIds.has(Number(promo.id)))
    .filter((promo) => promoMatches({
      promo,
      durationHours,
      guests,
      bathCost,
      startDate,
    }))
    .map((promo) => Number(promo.id));
};

export const buildPromotionSelectionRows = ({
  promos,
  selectedIds,
  durationHours,
  guests,
  bathCost,
  startDate,
}) => {
  const list = (promos || []).filter((p) => p && p.is_active !== false);
  const selectedSet = new Set((selectedIds || []).map(Number));

  return list.map((promo) => {
    const mismatchReasons = getPromoMismatchReasons({
      promo,
      durationHours,
      guests,
      bathCost,
      startDate,
    });
    const incompatibleWithSelected = list
      .filter((other) => selectedSet.has(Number(other.id)) && arePromotionsIncompatible(promo, other))
      .map((other) => other.name);

    return {
      promo,
      id: Number(promo.id),
      checked: selectedSet.has(Number(promo.id)),
      mismatchReasons,
      incompatibleWithSelected,
    };
  });
};

export const togglePromotionSelection = ({
  promos,
  selectedIds,
  promoId,
  checked,
}) => {
  const list = promos || [];
  const target = list.find((p) => Number(p.id) === Number(promoId));
  if (!target) return selectedIds || [];

  let next = new Set((selectedIds || []).map(Number));
  if (checked) {
    next.add(Number(promoId));
    list.forEach((other) => {
      if (arePromotionsIncompatible(target, other)) {
        next.delete(Number(other.id));
      }
    });
  } else {
    next.delete(Number(promoId));
  }
  return Array.from(next);
};

export const applySelectedPromotions = (promos, selectedIds) => {
  const selectedSet = new Set((selectedIds || []).map(Number));
  const selected = (promos || []).filter((p) => selectedSet.has(Number(p.id)));
  const bonusMinutes = selected.reduce((sum, promo) => sum + (Number(promo.bonus_minutes) || 0), 0);

  const giftMap = new Map();
  selected.forEach((promo) => {
    (promo.gift_products || []).forEach((gp) => {
      const productId = Number(gp.product_id);
      const quantity = Number(gp.quantity) || 1;
      if (giftMap.has(productId)) {
        giftMap.get(productId).quantity += quantity;
      } else {
        giftMap.set(productId, {
          product_id: productId,
          product_name: gp.product_name || `Товар #${productId}`,
          quantity,
        });
      }
    });
  });

  return {
    selectedPromotions: selected,
    bonusMinutes,
    giftProducts: Array.from(giftMap.values()),
    label: selected.map((p) => p.name).join(', '),
  };
};

export const getSnapshotPromotionIds = (booking) => {
  if (Array.isArray(booking?.applied_promotion_ids) && booking.applied_promotion_ids.length) {
    return booking.applied_promotion_ids.map(Number);
  }
  const snapshot = booking?.promotion_snapshot;
  if (!snapshot) return [];
  if (Array.isArray(snapshot.promotions) && snapshot.promotions.length) {
    return snapshot.promotions.map((p) => Number(p.id)).filter(Boolean);
  }
  if (snapshot.id != null) return [Number(snapshot.id)];
  if (booking?.applied_promotion_id != null) return [Number(booking.applied_promotion_id)];
  return [];
};

export const normalizePromotionSnapshot = (snapshot) => {
  if (!snapshot) {
    return { promotions: [], bonus_minutes: 0, gift_products: [], name: '' };
  }
  if (Array.isArray(snapshot.promotions)) {
    return snapshot;
  }
  return {
    promotions: [snapshot],
    bonus_minutes: Number(snapshot.bonus_minutes) || 0,
    gift_products: snapshot.gift_products || [],
    id: snapshot.id,
    name: snapshot.name || '',
  };
};
