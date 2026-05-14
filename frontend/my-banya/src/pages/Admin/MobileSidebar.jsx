// src/components/MobileSidebar.jsx
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetPermissionsQuery } from '../../redux/slices/apiSlice';
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

function MobileSidebar({ isOpen, onClose }) {
  const { user } = useSelector((state) => state.auth);
  const { permissions = [] } = useGetPermissionsQuery();

  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);

  // Сброс раскрытых секций при закрытии меню
  useEffect(() => {
    if (!isOpen) {
      setIsCompanyOpen(false);
      setIsDocumentsOpen(false);
      setIsStorageOpen(false);
    }
  }, [isOpen]);

  const hasAccess = (path) => {
    if (!user || !permissions.length) return true;
    const perm = permissions.find(p =>
      path === p.path || path.startsWith(p.path + '/')
    );
    if (!perm) return true;
    return perm.allowed_roles.includes(user.role_id);
  };

  const toggleCompany = () => setIsCompanyOpen(!isCompanyOpen);
  const toggleDocuments = () => setIsDocumentsOpen(!isDocumentsOpen);
  const toggleStorage = () => setIsStorageOpen(!isStorageOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div
        className="fixed left-0 top-0 w-64 h-full bg-white shadow-lg border-r border-gray-200 overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // предотвращает закрытие при клике внутри меню
      >
        <div className="p-6 border-b border-gray-200">
          <NavLink to="/admin/" className="text-2xl font-bold text-gray-800 hover:text-green-700 transition block" onClick={onClose}>
            Админ панель
          </NavLink>
          <NavLink to="/" className="text-sm text-gray-500 mt-1 hover:underline block" onClick={onClose}>
            Николаевские бани
          </NavLink>
        </div>

        <nav className="p-4 space-y-2">
            <NavLink
              to="/admin/administrator"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 rounded-xl"
              onClick={onClose}
            >
              <ShieldCheck className="w-5 h-5 mr-3" />
              Администратор
            </NavLink>

            <NavLink
              to="/admin/reservations"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 rounded-xl"
              onClick={onClose}
            >
              <CalendarDays className="w-5 h-5 mr-3" />
              Бронирование
            </NavLink>

          {/* Компания */}
          {(hasAccess('/admin/company/user') ||
            hasAccess('/admin/company/partner') ||
            hasAccess('/admin/company/organization')) && (
              <div>
                <button
                  onClick={toggleCompany}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-gray-700 hover:bg-green-50 rounded-xl"
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
                          className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-green-50 rounded-lg"
                          onClick={onClose}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Сотрудники
                        </NavLink>
                    )}
                    {hasAccess('/admin/company/partner') && (
                        <NavLink
                          to="/admin/company/partner"
                          className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-green-50 rounded-lg"
                          onClick={onClose}
                        >
                          <Truck className="w-4 h-4 mr-2" />
                          Поставщики
                        </NavLink>
                    )}

                    {hasAccess('/admin/company/organization') && (
                        <NavLink
                          to="/admin/company/organization"
                          className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-green-50 rounded-lg"
                          onClick={onClose}
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
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-gray-700 hover:bg-green-50 rounded-xl"
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
                          className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-green-50 rounded-lg"
                          onClick={onClose}
                        >
                          <FilePlus2 className="w-4 h-4 mr-2" />
                          Поступление
                        </NavLink>
                    )}
                    {hasAccess('/admin/documents/realization') && (
                        <NavLink
                          to="/admin/documents/realization"
                          className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-green-50 rounded-lg"
                          onClick={onClose}
                        >
                          <FileMinus2 className="w-4 h-4 mr-2" />
                          Реализация
                        </NavLink>
                    )}
                    {hasAccess('/admin/documents/product-requests') && (
                        <NavLink
                          to="/admin/documents/product-requests"
                          className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-green-50 rounded-lg"
                          onClick={onClose}
                        >
                          <ClipboardList className="w-4 h-4 mr-2" />
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
                className="w-full flex items-center justify-between px-4 py-3 text-left text-gray-700 hover:bg-green-50 rounded-xl"
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
                      className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-green-50 rounded-lg"
                      onClick={onClose}
                    >
                      <Barcode className="w-4 h-4 mr-2" />
                      Номенклатура
                    </NavLink>
                </div>
              )}
            </div>
          )}

            <NavLink
              to="/admin/deletion-requests"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 rounded-xl"
              onClick={onClose}
            >
              <Trash2 className="w-5 h-5 mr-3" />
              Запросы на удаление
            </NavLink>

            <NavLink
              to="/admin/bookings"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 rounded-xl"
              onClick={onClose}
            >
              <Globe className="w-5 h-5 mr-3" />
              Заявки с сайта
            </NavLink>

            <NavLink
              to="/admin/baths"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 rounded-xl"
              onClick={onClose}
            >
              <Home className="w-5 h-5 mr-3" />
              Бани
            </NavLink>

            <NavLink
              to="/admin/promotions"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 rounded-xl"
              onClick={onClose}
            >
              <Tag className="w-5 h-5 mr-3" />
              Акции
            </NavLink>

            <NavLink
              to="/admin/finance"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-emerald-50 rounded-xl"
              onClick={onClose}
            >
              <Wallet className="w-5 h-5 mr-3" />
              Финансы
            </NavLink>

          {/* Настройки - только для директора и админа */}
            <NavLink
              to="/admin/settings"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-xl"
              onClick={onClose}
            >
              <Settings className="w-5 h-5 mr-3" />
              Настройки
            </NavLink>

          {/* Поддержка - доступно всем */}
          <NavLink
            to="/admin/support"
            className="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 rounded-xl"
            onClick={onClose}
          >
            <HelpCircle className="w-5 h-5 mr-3" />
            Поддержка
          </NavLink>

          <button
            onClick={() => {
              localStorage.removeItem('access_token');
              window.location.href = '/admin/login';
            }}
            className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg mt-4"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Выйти
          </button>
        </nav>
      </div>
    </div>
  );
}

export default MobileSidebar;