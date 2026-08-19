const SEGMENT_MINUTES = 30;

export function parseHm(hm) {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

export function isWeekendDate(date) {
  const wd = (date.getDay() + 6) % 7;
  return wd >= 4;
}

export function timeInInterval(minutes, fromHm, toHm) {
  const fromM = parseHm(fromHm);
  const toM = parseHm(toHm);
  if (fromM < toM) {
    return minutes >= fromM && minutes < toM;
  }
  return minutes >= fromM || minutes < toM;
}

export function hasTimeTariffs(bath) {
  const tariffs = bath?.time_tariffs;
  if (!tariffs || typeof tariffs !== 'object') return false;
  const weekday = Array.isArray(tariffs.weekday) && tariffs.weekday.length > 0;
  const weekend = Array.isArray(tariffs.weekend) && tariffs.weekend.length > 0;
  return weekday || weekend;
}

export function priceForDateTime(bath, dt) {
  const isWknd = isWeekendDate(dt);
  const tariffs = bath?.time_tariffs;
  if (tariffs && typeof tariffs === 'object') {
    const key = isWknd ? 'weekend' : 'weekday';
    const slots = tariffs[key] || [];
    if (slots.length > 0) {
      const minutes = dt.getHours() * 60 + dt.getMinutes();
      for (const slot of slots) {
        if (timeInInterval(minutes, slot.from, slot.to)) {
          return Number(slot.price);
        }
      }
    }
  }
  return isWknd ? Number(bath.cost_weekend) : Number(bath.cost_weekday);
}

export function calculateBathBaseCost(bath, startDt, endDt, hourlyRateOverride = null) {
  const paidHours = (endDt - startDt) / (1000 * 60 * 60);
  if (paidHours <= 0) {
    return {
      bathBaseCost: 0,
      effectiveHourlyRate: 0,
      segments: [],
      usesTariffs: false,
      isManualOverride: false,
    };
  }

  if (hourlyRateOverride != null && hourlyRateOverride !== '') {
    const rate = Number(hourlyRateOverride);
    return {
      bathBaseCost: Math.round(rate * paidHours),
      effectiveHourlyRate: rate,
      segments: [{ hours: paidHours, price: rate }],
      usesTariffs: false,
      isManualOverride: true,
    };
  }

  let totalCost = 0;
  const segmentMs = SEGMENT_MINUTES * 60 * 1000;
  let current = new Date(startDt);
  const segmentTotals = new Map();

  while (current < endDt) {
    const segmentEnd = new Date(Math.min(current.getTime() + segmentMs, endDt.getTime()));
    const segmentHours = (segmentEnd - current) / (1000 * 60 * 60);
    const price = priceForDateTime(bath, current);
    totalCost += price * segmentHours;
    segmentTotals.set(price, (segmentTotals.get(price) || 0) + segmentHours);
    current = segmentEnd;
  }

  const segments = Array.from(segmentTotals.entries())
    .map(([price, hours]) => ({ price, hours }))
    .sort((a, b) => b.hours - a.hours);

  return {
    bathBaseCost: Math.round(totalCost),
    effectiveHourlyRate: Math.round(totalCost / paidHours),
    segments,
    usesTariffs: hasTimeTariffs(bath),
    isManualOverride: false,
  };
}

export function getEffectiveHourlyRate(bath, dateYmd, startTime, durationHours) {
  if (!bath || !dateYmd || !startTime) return '';
  const start = new Date(`${dateYmd}T${startTime}:00`);
  if (Number.isNaN(start.getTime())) return '';
  const duration = Number(durationHours) || 1;
  const end = new Date(start.getTime() + duration * 3600 * 1000);
  const { effectiveHourlyRate } = calculateBathBaseCost(bath, start, end);
  return Number.isFinite(effectiveHourlyRate) ? effectiveHourlyRate : '';
}

export function getPriceRangeLabel(bath, dayType = 'weekday') {
  const tariffs = bath?.time_tariffs;
  if (tariffs && typeof tariffs === 'object') {
    const slots = tariffs[dayType] || [];
    if (slots.length > 0) {
      const prices = slots.map((s) => Number(s.price)).filter((p) => p > 0);
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min === max) return String(min);
        return `${min}–${max}`;
      }
    }
  }
  return dayType === 'weekend' ? String(bath.cost_weekend) : String(bath.cost_weekday);
}

export const DEFAULT_TIME_TARIFFS = {
  weekday: [
    { from: '08:00', to: '17:00', price: 2000 },
    { from: '17:00', to: '08:00', price: 2500 },
  ],
  weekend: [
    { from: '08:00', to: '17:00', price: 2200 },
    { from: '17:00', to: '08:00', price: 2800 },
  ],
};

export function buildTimeTariffsFromFlatCosts(costWeekday, costWeekend) {
  return {
    weekday: [
      { from: '08:00', to: '17:00', price: Number(costWeekday) || 0 },
      { from: '17:00', to: '08:00', price: Number(costWeekday) || 0 },
    ],
    weekend: [
      { from: '08:00', to: '17:00', price: Number(costWeekend) || 0 },
      { from: '17:00', to: '08:00', price: Number(costWeekend) || 0 },
    ],
  };
}

export function formatSegmentBreakdown(segments, formatMoney) {
  if (!segments?.length) return '';
  if (segments.length === 1) {
    const { hours, price } = segments[0];
    const hoursLabel = Number.isInteger(hours) ? hours : hours.toFixed(1);
    return `${hoursLabel} ч × ${formatMoney(price)}`;
  }
  return segments
    .map(({ hours, price }) => {
      const hoursLabel = Number.isInteger(hours) ? hours : hours.toFixed(1);
      return `${hoursLabel} ч × ${formatMoney(price)}`;
    })
    .join(' + ');
}
