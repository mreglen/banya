import {
  getMobileRoleProfile,
  getMobileBottomNavItems,
  getMobileMoreItems,
  isNavPathActive,
  MOBILE_HOME_PATH,
} from '../config/adminNavConfig';

const mockHasAccess = (code) => {
  const employeePerms = [
    'reservations:view',
    'bookings:view',
    'storage:view',
    'documents:view',
    'documents:manage',
  ];
  return employeePerms.includes(code);
};

describe('adminNavConfig', () => {
  test('employee profile', () => {
    expect(getMobileRoleProfile({})).toBe('employee');
    expect(getMobileRoleProfile({ is_director: true })).toBe('director');
    expect(getMobileRoleProfile({ is_admin: true })).toBe('admin');
  });

  test('employee bottom nav items', () => {
    const user = { is_admin: false, is_director: false };
    const items = getMobileBottomNavItems('employee', mockHasAccess, user);
    expect(items.map((i) => i.id)).toEqual(['realization', 'bookings', 'storage', 'documents']);
  });

  test('director bottom nav includes summary and finance', () => {
    const user = { is_director: true };
    const hasAccess = () => true;
    const items = getMobileBottomNavItems('director', hasAccess, user);
    expect(items.some((i) => i.id === 'summary')).toBe(true);
    expect(items.some((i) => i.id === 'finance')).toBe(true);
  });

  test('admin bottom nav includes system tab', () => {
    const user = { is_admin: true };
    const hasAccess = () => true;
    const items = getMobileBottomNavItems('admin', hasAccess, user);
    expect(items.some((i) => i.id === 'system')).toBe(true);
  });

  test('more menu excludes bottom nav duplicates for employee', () => {
    const user = {};
    const sections = getMobileMoreItems('employee', mockHasAccess, user);
    const paths = Object.values(sections).flat().map((i) => i.path);
    expect(paths).not.toContain('/admin/bookings');
    expect(paths).not.toContain('/admin/storage/nomenclature');
    expect(paths).toContain('/admin/reservations');
  });

  test('mobile home path', () => {
    expect(MOBILE_HOME_PATH).toBe('/admin/documents/realization');
  });

  test('isNavPathActive respects matchExact', () => {
    expect(isNavPathActive('/admin/summary', { path: '/admin/summary', matchPrefix: '/admin/summary' })).toBe(true);
    expect(isNavPathActive('/admin/documents/realization', { path: '/admin', matchExact: true })).toBe(false);
  });
});
