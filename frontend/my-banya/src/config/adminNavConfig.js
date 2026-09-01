/**
 * Единая конфигурация мобильной навигации админки по ролям.
 * Права проверяются через permission / adminOnly / directorOrAdmin.
 */

export const MOBILE_HOME_PATH = '/admin/documents/realization';

export const ADMIN_NAV_SECTIONS = {
  operations: 'Операции',
  documents: 'Документы',
  company: 'Компания',
  system: 'Система',
};

/** @typedef {'employee'|'director'|'admin'} MobileRoleProfile */

/**
 * @param {{ is_admin?: boolean, is_director?: boolean }} user
 * @returns {MobileRoleProfile}
 */
export function getMobileRoleProfile(user) {
  if (user?.is_admin) return 'admin';
  if (user?.is_director) return 'director';
  return 'employee';
}

/**
 * @param {object} item
 * @param {(code: string|string[]) => boolean} hasAccess
 * @param {{ is_admin?: boolean }} user
 */
export function isNavItemVisible(item, hasAccess, user) {
  if (item.adminOnly && !user?.is_admin) return false;
  if (item.permission && !hasAccess(item.permission)) return false;
  return true;
}

/** Нижняя панель: id совпадает с ключом профиля */
export const MOBILE_BOTTOM_NAV = {
  employee: [
    { id: 'realization', path: '/admin/documents/realization', label: 'Реализация', permission: 'documents:view', matchPrefix: '/admin/documents/realization' },
    { id: 'bookings', path: '/admin/bookings', label: 'Заявки', permission: 'bookings:view', badge: 'bookings' },
    { id: 'storage', path: '/admin/storage/nomenclature', label: 'Склад', permission: 'storage:view', matchPrefix: '/admin/storage' },
    { id: 'documents', path: '/admin/documents/entrance', label: 'Документы', permission: 'documents:view', matchPrefix: '/admin/documents' },
  ],
  director: [
    { id: 'realization', path: '/admin/documents/realization', label: 'Реализация', permission: 'documents:view', matchPrefix: '/admin/documents/realization' },
    { id: 'summary', path: '/admin/summary', label: 'Сводка', matchPrefix: '/admin/summary' },
    { id: 'finance', path: '/admin/finance', label: 'Финансы', permission: 'finance:view' },
    { id: 'storage', path: '/admin/storage/nomenclature', label: 'Склад', permission: 'storage:view', matchPrefix: '/admin/storage' },
  ],
  admin: [
    { id: 'realization', path: '/admin/documents/realization', label: 'Реализация', permission: 'documents:view', matchPrefix: '/admin/documents/realization' },
    { id: 'summary', path: '/admin/summary', label: 'Сводка', matchPrefix: '/admin/summary' },
    { id: 'system', path: '/admin/administrator', label: 'Система', adminOnly: true, matchPrefix: '/admin/administrator' },
    { id: 'storage', path: '/admin/storage/nomenclature', label: 'Склад', permission: 'storage:view', matchPrefix: '/admin/storage' },
  ],
};

/** Пункты меню «Ещё» — не дублируют основные вкладки профиля */
export const MOBILE_MORE_ITEMS = [
  { path: '/admin/reservations', label: 'Бронирование', section: 'operations', permission: 'reservations:view' },
  { path: '/admin/bookings', label: 'Заявки с сайта', section: 'operations', permission: 'bookings:view', badge: 'bookings' },
  { path: '/admin/documents/entrance', label: 'Поступление', section: 'documents', permission: 'documents:view' },
  { path: '/admin/documents/product-requests', label: 'Заявки на товар', section: 'documents', permission: 'documents:view' },
  { path: '/admin/documents/realization', label: 'Реализация', section: 'documents', permission: 'documents:view' },
  { path: '/admin/company/user', label: 'Сотрудники', section: 'company', permission: 'staff:view', adminOnly: true },
  { path: '/admin/company/client', label: 'Клиенты', section: 'company', permission: 'clients:view', adminOnly: true },
  { path: '/admin/company/partner', label: 'Поставщики', section: 'company', permission: 'partners:view', adminOnly: true },
  { path: '/admin/company/organization', label: 'Организация', section: 'company', adminOnly: true },
  { path: '/admin/baths', label: 'Бани', section: 'operations', permission: 'baths:view' },
  { path: '/admin/promotions', label: 'Акции', section: 'operations', permission: 'promotions:view' },
  { path: '/admin/finance', label: 'Финансы', section: 'operations', permission: 'finance:view' },
  { path: '/admin/deletion-requests', label: 'Запросы на удаление', section: 'system', permission: 'staff:manage' },
  { path: '/admin/administrator', label: 'Панель администратора', section: 'system', adminOnly: true },
  { path: '/admin/administrator/audit', label: 'Журнал аудита', section: 'system', adminOnly: true },
  { path: '/admin/administrator/roles', label: 'Роли', section: 'system', adminOnly: true },
  { path: '/admin/settings', label: 'Настройки', section: 'system', adminOnly: true },
  { path: '/admin/support', label: 'Поддержка', section: 'system' },
];

/**
 * @param {string} pathname
 * @param {object} item
 */
export function isNavPathActive(pathname, item) {
  if (item.matchExact) {
    return pathname === item.path || pathname === `${item.path}/`;
  }
  const prefix = item.matchPrefix || item.path;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * @param {MobileRoleProfile} profile
 * @param {(code: string|string[]) => boolean} hasAccess
 * @param {{ is_admin?: boolean }} user
 */
export function getMobileBottomNavItems(profile, hasAccess, user) {
  const items = MOBILE_BOTTOM_NAV[profile] || MOBILE_BOTTOM_NAV.employee;
  return items.filter((item) => isNavItemVisible(item, hasAccess, user));
}

/**
 * @param {MobileRoleProfile} profile
 * @param {(code: string|string[]) => boolean} hasAccess
 * @param {{ is_admin?: boolean }} user
 */
export function getMobileMoreItems(profile, hasAccess, user) {
  const bottomPaths = new Set(
    (MOBILE_BOTTOM_NAV[profile] || []).map((item) => item.path)
  );

  const visible = MOBILE_MORE_ITEMS.filter((item) => {
    if (!isNavItemVisible(item, hasAccess, user)) return false;
    if (bottomPaths.has(item.path)) return false;
    return true;
  });

  const bySection = {};
  visible.forEach((item) => {
    const section = item.section || 'operations';
    if (!bySection[section]) bySection[section] = [];
    bySection[section].push(item);
  });

  return bySection;
}

/** Заголовки страниц для мобильного header */
export const ADMIN_PAGE_TITLES = {
  '/admin/': 'Сводка',
  '/admin/summary': 'Сводка',
  '/admin/administrator': 'Система',
  '/admin/reservations': 'Бронирование',
  '/admin/company/user': 'Сотрудники',
  '/admin/company/partner': 'Поставщики',
  '/admin/company/organization': 'Организация',
  '/admin/company/client': 'Клиенты',
  '/admin/documents/entrance': 'Поступление',
  '/admin/documents/entrance/drafts': 'Черновики',
  '/admin/documents/realization': 'Реализация',
  '/admin/documents/product-requests': 'Заявки на товар',
  '/admin/storage/nomenclature': 'Склад',
  '/admin/settings': 'Настройки',
  '/admin/support': 'Поддержка',
  '/admin/deletion-requests': 'Удаление',
  '/admin/bookings': 'Заявки',
  '/admin/baths': 'Бани',
  '/admin/promotions': 'Акции',
  '/admin/finance': 'Финансы',
  '/admin/administrator/audit': 'Аудит',
  '/admin/administrator/roles': 'Роли',
};

export function getAdminPageTitle(pathname) {
  if (ADMIN_PAGE_TITLES[pathname]) return ADMIN_PAGE_TITLES[pathname];
  for (const [route, title] of Object.entries(ADMIN_PAGE_TITLES)) {
    if (pathname.startsWith(route) && route !== '/admin/') return title;
  }
  return 'Админ';
}
