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
    // Admin has access to everything
    if (user.is_admin) return true;
    // Check if user has the specific permission
    if (!user.permissions) return false;
    return user.permissions.includes(permission);
  };
}

export default useHasAccess;
