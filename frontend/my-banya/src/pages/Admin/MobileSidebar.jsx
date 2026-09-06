// src/pages/Admin/MobileSidebar.jsx
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useUnreadBookingsCount } from '../../hooks/useUnreadBookingsCount';
import { useHasAccess } from '../../hooks/useHasAccess';
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
  ChevronRight,
} from 'lucide-react';

function MobileSidebar({ isOpen, onClose }) {
  const { user } = useSelector((state) => state.auth);
  const hasAccess = useHasAccess();
  const canViewBookings = hasAccess('bookings:view');
  const canViewDocuments = hasAccess('documents:view');
  const canViewStorage = hasAccess('storage:view');
  const unreadBookingsCount = useUnreadBookingsCount({ skip: !canViewBookings });

  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsCompanyOpen(false);
      setIsDocumentsOpen(false);
      setIsStorageOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div
        className="fixed left-0 top-0 w-64 h-full bg-white shadow-lg border-r border-gray-200 overflow-y-auto scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <NavLink
            to="/admin/"
            className="text-2xl font-bold text-gray-800 hover:text-green-700 transition block"
            onClick={onClose}
          >
            Админ панель
          </NavLink>
          <NavLink
            to="/"
            className="text-sm text-gray-500 mt-1 hover:underline block"
            onClick={onClose}
          >
            Николаевские бани
          </NavLink>
        </div>

        <nav className="p-4 space-y-2">
          {user?.is_admin && (
            <NavLink
              to="/admin/administrator"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-purple-50 rounded-xl"
              onClick={onClose}
            >
              <ShieldCheck className="w-5 h-5 mr-3" />
              Администратор
            </NavLink>
          )}

          {hasAccess('reservations:view') && (
            <NavLink
              to="/admin/reservations"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 rounded-xl"
              onClick={onClose}
            >
              <CalendarDays className="w-5 h-5 mr-3" />
              Бронирование
            </NavLink>
          )}

          {user?.is_admin && (
            <div>
              <button
                type="button"
                onClick={() => setIsCompanyOpen(!isCompanyOpen)}
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
                  {hasAccess('staff:view') && (
                    <NavLink
                      to="/admin/company/user"
                      className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-green-50 rounded-lg"
                      onClick={onClose}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Сотрудники
                    </NavLink>
                  )}
                  {hasAccess('partners:view') && (
                    <NavLink
                      to="/admin/company/partner"
                      className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-green-50 rounded-lg"
                      onClick={onClose}
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Поставщики
                    </NavLink>
                  )}
                  <NavLink
                    to="/admin/company/organization"
                    className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-green-50 rounded-lg"
                    onClick={onClose}
                  >
                    <Hotel className="w-4 h-4 mr-2" />
                    Организация
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {canViewDocuments && (
            <div>
              <button
                type="button"
                onClick={() => setIsDocumentsOpen(!isDocumentsOpen)}
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
                  <NavLink
                    to="/admin/documents/entrance"
                    className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-green-50 rounded-lg"
                    onClick={onClose}
                  >
                    <FilePlus2 className="w-4 h-4 mr-2" />
                    Поступление
                  </NavLink>
                  <NavLink
                    to="/admin/documents/product-requests"
                    className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-green-50 rounded-lg"
                    onClick={onClose}
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Заявки на товар
                  </NavLink>
                  <NavLink
                    to="/admin/documents/realization"
                    className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-green-50 rounded-lg"
                    onClick={onClose}
                  >
                    <FileMinus2 className="w-4 h-4 mr-2" />
                    Реализация
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {canViewStorage && (
            <div>
              <button
                type="button"
                onClick={() => setIsStorageOpen(!isStorageOpen)}
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
                    Все товары
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {hasAccess('staff:manage') && (
            <NavLink
              to="/admin/deletion-requests"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 rounded-xl"
              onClick={onClose}
            >
              <Trash2 className="w-5 h-5 mr-3" />
              Запросы на удаление
            </NavLink>
          )}

          {canViewBookings && (
            <NavLink
              to="/admin/bookings"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 rounded-xl"
              onClick={onClose}
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

          {hasAccess('baths:view') && (
            <NavLink
              to="/admin/baths"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 rounded-xl"
              onClick={onClose}
            >
              <Home className="w-5 h-5 mr-3" />
              Бани
            </NavLink>
          )}

          {hasAccess('promotions:view') && (
            <NavLink
              to="/admin/promotions"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 rounded-xl"
              onClick={onClose}
            >
              <Tag className="w-5 h-5 mr-3" />
              Акции
            </NavLink>
          )}

          {hasAccess('finance:view') && (
            <NavLink
              to="/admin/finance"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-emerald-50 rounded-xl"
              onClick={onClose}
            >
              <Wallet className="w-5 h-5 mr-3" />
              Финансы
            </NavLink>
          )}

          {user?.is_admin && (
            <NavLink
              to="/admin/settings"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-xl"
              onClick={onClose}
            >
              <Settings className="w-5 h-5 mr-3" />
              Настройки
            </NavLink>
          )}

          <NavLink
            to="/admin/support"
            className="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 rounded-xl"
            onClick={onClose}
          >
            <HelpCircle className="w-5 h-5 mr-3" />
            Поддержка
          </NavLink>

          <button
            type="button"
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
