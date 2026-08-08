import { NavLink } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { ADMIN_NAV_SECTIONS } from '../../config/adminNavConfig';
import { useUnreadBookingsCount } from '../../hooks/useUnreadBookingsCount';

function MobileMoreSheet({ isOpen, onClose, user, moreSections }) {
  const unreadBookingsCount = useUnreadBookingsCount();

  if (!isOpen) return null;

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/admin/login';
  };

  const sectionOrder = ['operations', 'documents', 'company', 'system'];

  return (
    <div className="md:hidden fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Закрыть меню"
        onClick={onClose}
      />
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-500">Меню</p>
            <p className="font-semibold text-gray-900 truncate max-w-[240px]">
              {user?.full_name || 'Пользователь'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-3 py-3 space-y-4">
          {sectionOrder.map((sectionKey) => {
            const items = moreSections[sectionKey];
            if (!items?.length) return null;
            return (
              <div key={sectionKey}>
                <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {ADMIN_NAV_SECTIONS[sectionKey]}
                </p>
                <div className="space-y-1">
                  {items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                          isActive
                            ? 'bg-green-50 text-green-800'
                            : 'text-gray-800 hover:bg-gray-50'
                        }`
                      }
                    >
                      <span className="flex-1">{item.label}</span>
                      {item.badge === 'bookings' && unreadBookingsCount > 0 && (
                        <span className="ml-2 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
                          {unreadBookingsCount > 99 ? '99+' : unreadBookingsCount}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-red-50 text-red-700 font-medium"
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}

export default MobileMoreSheet;
