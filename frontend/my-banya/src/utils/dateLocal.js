/** Локальная дата YYYY-MM-DD без сдвига в UTC. */
export function formatLocalYmd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Локальное время HH:MM. */
export function formatLocalHm(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Показать календарную дату YYYY-MM-DD как ДД.ММ.ГГГГ
 * без new Date('YYYY-MM-DD') — иначе браузер считает её UTC и сдвигает день.
 */
export function formatYmdToRu(ymd) {
  if (!ymd) return '—';
  const raw = String(ymd).slice(0, 10);
  const [y, m, d] = raw.split('-');
  if (!y || !m || !d) return raw;
  return `${d}.${m}.${y}`;
}

/** Оставить только YYYY-MM-DD из ISO/строки даты. */
export function toYmd(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}
