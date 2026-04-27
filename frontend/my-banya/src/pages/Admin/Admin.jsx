// src/pages/Admin/Admin.jsx
import { useState, useEffect } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetPermissionsQuery } from '../../redux/slices/apiSlice';
import MobileSidebar from './MobileSidebar';
import MobileBottomNav from '../../components/Admin/MobileBottomNav';

function Admin() {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { permissions = [] } = useGetPermissionsQuery();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  // Принудительно обновляем Outlet при смене маршрута
  useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [location.pathname]);

  // Map of routes to page titles
  const getPageTitle = () => {
    const path = location.pathname;
    
    const pageTitles = {
      '/admin/': 'Главная',
      '/admin/administrator': 'Администратор',
      '/admin/reservations': 'Бронирование',
      '/admin/company/user': 'Сотрудники',
      '/admin/company/partner': 'Поставщики',
      '/admin/documents/entrance': 'Поступление',
      '/admin/documents/realization': 'Реализация',
      '/admin/documents/product-requests': 'Заявки на товар',
      '/admin/storage/nomenclature': 'Номенклатура',
      '/admin/settings': 'Настройки',
      '/admin/deletion-requests': 'Запросы на удаление',
      '/admin/bookings': 'Заявки с сайта',
      '/admin/baths': 'Бани',
      '/admin/promotions': 'Акции',
    };

    // Check for exact match first
    if (pageTitles[path]) {
      return pageTitles[path];
    }

    // Check for partial matches
    for (const [route, title] of Object.entries(pageTitles)) {
      if (path.startsWith(route)) {
        return title;
      }
    }

    return 'Админ панель';
  };

  // Автооткрытие секций при навигации (десктоп)
  useEffect(() => {
    setIsCompanyOpen(location.pathname.startsWith('/admin/company'));
    setIsDocumentsOpen(location.pathname.startsWith('/admin/documents'));
    setIsStorageOpen(location.pathname.startsWith('/admin/storage'));
  }, [location.pathname]);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/admin/login';
  };

  const toggleCompany = () => setIsCompanyOpen(!isCompanyOpen);
  const toggleDocuments = () => setIsDocumentsOpen(!isDocumentsOpen);
  const toggleStorage = () => setIsStorageOpen(!isStorageOpen);

  const hasAccess = (path) => {
    if (!user || !permissions.length) return true;
    const perm = permissions.find(p =>
      path === p.path || path.startsWith(p.path + '/')
    );
    if (!perm) return true;
    return perm.allowed_roles.includes(user.role_id);
  };

  // Десктопный сайдбар (виден только на md+)
  const DesktopSidebar = () => (
    <aside className="hidden md:block w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <NavLink to="/admin/" className="text-2xl font-bold text-gray-800 hover:text-green-700 transition">
          Админ панель
        </NavLink>
        <NavLink to="/" className="text-sm text-gray-500 mt-1 hover:underline block">
          Николаевские бани
        </NavLink>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {user?.is_admin && (
          <NavLink
            to="/admin/administrator"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition ${isActive
                ? 'bg-purple-100 text-purple-800 border border-purple-200 font-medium'
                : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Администратор
          </NavLink>
        )}

        {hasAccess('/admin/reservations') && (
          <NavLink
            to="/admin/reservations"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition ${isActive
                ? 'bg-green-100 text-green-800 border border-green-200 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Бронирование
          </NavLink>
        )}

        {/* Компания */}
        {(hasAccess('/admin/company/user') ||
          hasAccess('/admin/company/partner')) && (
            <div>
              <button
                onClick={toggleCompany}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition ${isCompanyOpen
                  ? 'bg-green-100 text-green-800 border border-green-200 font-medium'
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                  }`}
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Компания
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${isCompanyOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {isCompanyOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  {hasAccess('/admin/company/user') && (
                    <NavLink
                      to="/admin/company/user"
                      className={({ isActive }) =>
                        `flex items-center px-4 py-2 rounded-lg text-sm transition ${isActive
                          ? 'bg-green-100 text-green-800 font-medium'
                          : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                        }`
                      }
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Сотрудники
                    </NavLink>
                  )}
                  {hasAccess('/admin/company/partner') && (
                    <NavLink
                      to="/admin/company/partner"
                      className={({ isActive }) =>
                        `flex items-center px-4 py-2 rounded-lg text-sm transition ${isActive
                          ? 'bg-green-100 text-green-800 font-medium'
                          : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                        }`
                      }
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Поставщики
                    </NavLink>
                  )}
                </div>
              )}
            </div>
          )}

        {/* Документы */}
        {(hasAccess('/admin/documents/entrance') ||
          hasAccess('/admin/documents/realization') ||
          hasAccess('/admin/documents/product-requests')) && (
            <div>
              <button
                onClick={toggleDocuments}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition ${isDocumentsOpen
                  ? 'bg-green-100 text-green-800 border border-green-200 font-medium'
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                  }`}
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Документы
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${isDocumentsOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {isDocumentsOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  {hasAccess('/admin/documents/entrance') && (
                    <NavLink
                      to="/admin/documents/entrance"
                      className={({ isActive }) =>
                        `flex items-center px-4 py-2 rounded-lg text-sm transition ${isActive
                          ? 'bg-green-100 text-green-800 font-medium'
                          : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                        }`
                      }
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Поступление
                    </NavLink>
                  )}
                  {hasAccess('/admin/documents/realization') && (
                    <NavLink
                      to="/admin/documents/realization"
                      className={({ isActive }) =>
                        `flex items-center px-4 py-2 rounded-lg text-sm transition ${isActive
                          ? 'bg-green-100 text-green-800 font-medium'
                          : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                        }`
                      }
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Реализация
                    </NavLink>
                  )}
                  {hasAccess('/admin/documents/product-requests') && (
                    <NavLink
                      to="/admin/documents/product-requests"
                      className={({ isActive }) =>
                        `flex items-center px-4 py-2 rounded-lg text-sm transition ${isActive
                          ? 'bg-green-100 text-green-800 font-medium'
                          : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                        }`
                      }
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Заявки на товар
                    </NavLink>
                  )}
                </div>
              )}
            </div>
          )}

        {/* Склад */}
        {hasAccess('/admin/storage/nomenclature') && (
          <div>
            <button
              onClick={toggleStorage}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition ${isStorageOpen
                ? 'bg-green-100 text-green-800 border border-green-200 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                }`}
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Склад
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${isStorageOpen ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {isStorageOpen && (
              <div className="ml-4 mt-1 space-y-1">
                <NavLink
                  to="/admin/storage/nomenclature"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded-lg text-sm transition ${isActive
                      ? 'bg-green-100 text-green-800 font-medium'
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                    }`
                  }
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Номенклатура
                </NavLink>
              </div>
            )}
          </div>
        )}

        {hasAccess('/admin/deletion-requests') && (
          <NavLink
            to="/admin/deletion-requests"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition ${isActive
                ? 'bg-green-100 text-green-800 border border-green-200 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Запросы на удаление
          </NavLink>
        )}

        {hasAccess('/admin/bookings') && (
          <NavLink
            to="/admin/bookings"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition ${isActive
                ? 'bg-green-100 text-green-800 border border-green-200 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Заявки с сайта
          </NavLink>
        )}

        {hasAccess('/admin/site-content/baths') && (
          <NavLink
            to="/admin/baths"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition ${isActive
                ? 'bg-green-100 text-green-800 border border-green-200 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Бани
          </NavLink>
        )}

        {hasAccess('/admin/promotions') && (
          <NavLink
            to="/admin/promotions"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition ${isActive
                ? 'bg-green-100 text-green-800 border border-green-200 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Акции
          </NavLink>
        )}

        {/* Настройки - только для директора и админа */}
        {(user?.is_director || user?.is_admin) && (
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition ${isActive
                ? 'bg-blue-100 text-blue-800 border border-blue-200 font-medium'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Настройки
          </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Выйти
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-sm p-4 flex items-center">
        <button
          onClick={toggleMobileMenu}
          className="text-gray-700 focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="ml-4 text-lg font-bold">{getPageTitle()}</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:ml-0 ml-0 pt-16 md:pt-0 p-4 md:p-8 pb-20 md:pb-8">
        <Outlet key={renderKey} />
      </main>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        // Передаём данные в мобильное меню, если оно использует hasAccess и т.д.
        user={user}
        permissions={permissions}
        location={location}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

export default Admin;