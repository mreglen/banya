// src/pages/Admin/Admin.jsx
import { useState, useEffect } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetPermissionsQuery } from '../../redux/slices/apiSlice';
import { useUnreadBookingsCount } from '../../hooks/useUnreadBookingsCount';
import { getAdminPageTitle } from '../../config/adminNavConfig';
import AdminMobileEntryRedirect from '../../components/Admin/AdminMobileEntryRedirect';
import MobileBottomNav from '../../components/Admin/MobileBottomNav';
import SeoHead from '../../components/Seo/SeoHead';
import { 
  ShieldCheck, 
  CalendarDays, 
  Building2, 
  Users, 
  Truck, 
  Hotel, 
  FileText, 
  FilePlus2, 
  FileMinus2,
  ClipboardList,
  Package, 
  Barcode, 
  Trash2, 
  Globe, 
  Home, 
  Tag, 
  Wallet, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronRight
} from 'lucide-react';

function Admin() {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { permissions = [] } = useGetPermissionsQuery();

  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);

  const pageTitle = getAdminPageTitle(location.pathname);

  // Автооткрытие секций при навигации (десктоп)
  useEffect(() => {
    setIsCompanyOpen(location.pathname.startsWith('/admin/company'));
    setIsDocumentsOpen(location.pathname.startsWith('/admin/documents'));
    setIsStorageOpen(location.pathname.startsWith('/admin/storage'));
  }, [location.pathname]);

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

  const unreadBookingsCount = useUnreadBookingsCount({
    skip: !hasAccess('/admin/bookings'),
  });

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
            <ShieldCheck className="w-5 h-5 mr-3" />
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
            <CalendarDays className="w-5 h-5 mr-3" />
            Бронирование
          </NavLink>
        )}

        {/* Компания — только системный администратор */}
        {user?.is_admin && (
            <div>
              <button
                onClick={toggleCompany}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition ${isCompanyOpen
                  ? 'bg-green-100 text-green-800 border border-green-200 font-medium'
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                  }`}
              >
                <span className="flex items-center">
                  <Building2 className="w-5 h-5 mr-3" />
                  Компания
                </span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${isCompanyOpen ? 'rotate-90' : ''}`}
                />
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
                      <Users className="w-4 h-4 mr-2" />
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
                      <Truck className="w-4 h-4 mr-2" />
                      Поставщики
                    </NavLink>
                  )}

                  {hasAccess('/admin/company/organization') && (
                    <NavLink
                      to="/admin/company/organization"
                      className={({ isActive }) =>
                        `flex items-center px-4 py-2 rounded-lg text-sm transition ${isActive
                          ? 'bg-green-100 text-green-800 font-medium'
                          : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                        }`
                      }
                    >
                      <Hotel className="w-4 h-4 mr-2" />
                      Организация
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
                  <FileText className="w-5 h-5 mr-3" />
                  Документы
                </span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${isDocumentsOpen ? 'rotate-90' : ''}`}
                />
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
                      <FilePlus2 className="w-4 h-4 mr-2" />
                      Поступление
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
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Заявки на товар
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
                      <FileMinus2 className="w-4 h-4 mr-2" />
                      Реализация
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
                <Package className="w-5 h-5 mr-3" />
                Склад
              </span>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${isStorageOpen ? 'rotate-90' : ''}`}
              />
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
                  <Barcode className="w-4 h-4 mr-2" />
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
            <Trash2 className="w-5 h-5 mr-3" />
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
            <Globe className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="flex-1">Заявки с сайта</span>
            {unreadBookingsCount > 0 && (
              <span className="ml-2 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
                {unreadBookingsCount > 99 ? '99+' : unreadBookingsCount}
              </span>
            )}
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
            <Home className="w-5 h-5 mr-3" />
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
            <Tag className="w-5 h-5 mr-3" />
            Акции
          </NavLink>
        )}

        {hasAccess('/admin/finance') && (
          <NavLink
            to="/admin/finance"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition ${isActive
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium'
                : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
              }`
            }
          >
            <Wallet className="w-5 h-5 mr-3" />
            Финансы
          </NavLink>
        )}

        {/* Настройки - только для администратора */}
        {user?.is_admin && (
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition ${isActive
                ? 'bg-blue-100 text-blue-800 border border-blue-200 font-medium'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              }`
            }
          >
            <Settings className="w-5 h-5 mr-3" />
            Настройки
          </NavLink>
        )}

        {/* Поддержка - доступно всем */}
        <NavLink
          to="/admin/support"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-xl transition ${
              isActive
                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200 font-medium'
                : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
            }`
          }
        >
          <HelpCircle className="w-5 h-5 mr-3" />
          Поддержка
        </NavLink>
      </nav>

      <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Выйти
          </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SeoHead title="Админ-панель" noindex />
      <AdminMobileEntryRedirect />
      <DesktopSidebar />

      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center justify-center"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <h1 className="text-base font-bold text-gray-900 truncate">{pageTitle}</h1>
      </header>

      <main className="flex-1 md:ml-0 ml-0 pt-14 md:pt-0 px-3 md:px-8 py-3 md:py-8 pb-20 md:pb-8">
        <Outlet />
      </main>

      <MobileBottomNav />
    </div>
  );
}

export default Admin;