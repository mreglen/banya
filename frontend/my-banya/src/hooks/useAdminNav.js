import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHasAccess } from './useHasAccess';
import {
  getMobileRoleProfile,
  getMobileBottomNavItems,
  getMobileMoreItems,
  getAdminPageTitle,
  MOBILE_HOME_PATH,
} from '../config/adminNavConfig';

export function useAdminNav() {
  const { user } = useSelector((state) => state.auth);
  const hasAccess = useHasAccess();

  const profile = useMemo(() => getMobileRoleProfile(user), [user]);

  const bottomNavItems = useMemo(
    () => getMobileBottomNavItems(profile, hasAccess, user),
    [profile, hasAccess, user]
  );

  const moreSections = useMemo(
    () => getMobileMoreItems(profile, hasAccess, user),
    [profile, hasAccess, user]
  );

  return {
    user,
    profile,
    hasAccess,
    bottomNavItems,
    moreSections,
    mobileHomePath: MOBILE_HOME_PATH,
    getPageTitle: getAdminPageTitle,
  };
}

export default useAdminNav;
