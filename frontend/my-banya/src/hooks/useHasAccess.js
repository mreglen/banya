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
    // administrator:* permissions are admin-only
    if (permission?.startsWith('administrator:')) return !!user.is_admin;
    // Admin and director have access to all other permissions
    if (user.is_admin || user.is_director) return true;
    // Check if user has the specific permission
    if (!user.permissions) return false;
    return user.permissions.some((p) => (typeof p === 'string' ? p === permission : p.code === permission));
  };
}

export default useHasAccess;
