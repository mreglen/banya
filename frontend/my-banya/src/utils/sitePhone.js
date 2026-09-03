import SEO from '../config/seo';

/** Normalize Russian phone to +7XXXXXXXXXX for tel: links. */
export function normalizeSitePhone(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/[^\d+]/g, '').replace(/^\+/, '');
  let digits = cleaned;
  if (digits.length === 11 && digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`;
  } else if (digits.length === 10) {
    digits = `7${digits}`;
  } else if (!(digits.length === 11 && digits.startsWith('7'))) {
    return null;
  }
  return `+${digits}`;
}

/** Format for display: +7 (XXX) XXX-XX-XX */
export function formatSitePhone(phone) {
  const normalized = normalizeSitePhone(phone);
  if (!normalized) return phone || SEO.telephoneDisplay;
  const digits = normalized.slice(1);
  if (digits.length !== 11) return normalized;
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Resolve phone from organization settings with SEO fallback.
 * @returns {{ display: string, telHref: string, raw: string }}
 */
export function resolveSitePhone(orgPhone) {
  const raw = (orgPhone || '').trim() || SEO.telephoneDisplay;
  const normalized = normalizeSitePhone(raw) || SEO.telephone;
  return {
    raw,
    display: formatSitePhone(raw),
    telHref: `tel:${normalized}`,
  };
}
