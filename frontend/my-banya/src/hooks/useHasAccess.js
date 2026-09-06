// src/hooks/useHasAccess.js
import { useSelector } from 'react-redux';

/**
 * Права, которые НЕ выдаются админу/директору автоматически —
 * только если явно назначены роли.
 */
const EXPLICIT_ONLY_PERMISSIONS = new Set(['bookings:notify']);

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

    // Explicit-only: никогда не через is_admin / is_director
    if (required.every((code) => EXPLICIT_ONLY_PERMISSIONS.has(code))) {
      return required.some(hasExplicit);
    }

    // administrator:* permissions are admin-only
    if (required.some((code) => code?.startsWith('administrator:'))) return !!user.is_admin;

    // Admin and director have access to all other permissions
    if (user.is_admin || user.is_director) return true;

    if (!user.permissions) return false;
    return required.some(hasExplicit);
  };
}

export default useHasAccess;
