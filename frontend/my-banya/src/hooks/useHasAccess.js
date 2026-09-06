// src/hooks/useHasAccess.js
import { useSelector } from 'react-redux';

/**
 * Права, которые директору НЕ выдаются автоматически —
 * только явное назначение роли. Админ (is_admin) получает всё.
 */
const EXPLICIT_ONLY_FOR_DIRECTOR = new Set(['bookings:notify']);

/**
 * Hook to check if current user has specific permission
 * @returns {Function} hasAccess(permission) - returns boolean
 */
export function useHasAccess() {
  const { user } = useSelector(state => state.auth);
  
  return (permission) => {
    if (!user) return false;

    const required = Array.isArray(permission) ? permission : [permission];
    if (required.length === 0) return false;

    const hasExplicit = (code) =>
      Boolean(
        user.permissions?.some((p) =>
          typeof p === 'string' ? p === code : p.code === code
        )
      );

    // Системный админ — все права автоматически
    if (user.is_admin) return true;

    // administrator:* — только is_admin (уже обработан выше)
    if (required.some((code) => code?.startsWith('administrator:'))) return false;

    // Директор: всё, кроме explicit-only (например bookings:notify)
    if (user.is_director) {
      if (required.every((code) => EXPLICIT_ONLY_FOR_DIRECTOR.has(code))) {
        return required.some(hasExplicit);
      }
      if (required.some((code) => EXPLICIT_ONLY_FOR_DIRECTOR.has(code))) {
        return required.some(
          (code) =>
            !EXPLICIT_ONLY_FOR_DIRECTOR.has(code) || hasExplicit(code)
        );
      }
      return true;
    }

    if (!user.permissions) return false;
    return required.some(hasExplicit);
  };
}

export default useHasAccess;
