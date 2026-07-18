// src/hooks/useHasAccess.js
import { useSelector } from 'react-redux';

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

    // administrator:* permissions are admin-only
    if (required.some((code) => code?.startsWith('administrator:'))) return !!user.is_admin;
    // Admin and director have access to all other permissions
    if (user.is_admin || user.is_director) return true;
    // Check if user has any of the required permissions
    if (!user.permissions) return false;
    return required.some((code) =>
      user.permissions.some((p) => (typeof p === 'string' ? p === code : p.code === code))
    );
  };
}

export default useHasAccess;
