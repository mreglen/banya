import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import MobileSidebar from '../../pages/Admin/MobileSidebar';
import { useHasAccess } from '../../hooks/useHasAccess';
import { 
  CalendarDays, 
  Package, 
  FileText, 
  ClipboardList, 
  Wallet, 
  Menu 
} from 'lucide-react';

function MobileBottomNav() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasAccess = useHasAccess();

  // Фильтруем пункты меню по правам доступа
  const navItems = [
    hasAccess('reservations:view') && {
      path: '/admin/reservations',
      label: 'Бронирование',
      icon: <CalendarDays className="w-6 h-6" />,
    },
    hasAccess('storage:view') && {
      path: '/admin/storage/nomenclature',
      label: 'Склад',
      icon: <Package className="w-6 h-6" />,
    },
    hasAccess('documents:view') && {
      path: '/admin/documents/entrance',
      label: 'Документы',
      icon: <FileText className="w-6 h-6" />,
    },
    hasAccess('bookings:view') && {
      path: '/admin/bookings',
      label: 'Заявки',
      icon: <ClipboardList className="w-6 h-6" />,
    },
    hasAccess('finance:view') && {
      path: '/admin/finance',
      label: 'Финансы',
      icon: <Wallet className="w-6 h-6" />,
    },
  ].filter(Boolean); // Удаляем false значения

  // Проверяем, активен ли путь
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  active
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                }`}
                aria-label={item.label}
              >
                <div className="mb-1">{item.icon}</div>
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}

          {/* Кнопка "Ещё" */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-green-600 hover:bg-gray-50 transition-colors"
            aria-label="Ещё"
          >
            <Menu className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Ещё</span>
          </button>
        </div>
      </nav>

      {/* Мобильное меню (полный сайдбар) */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}

export default MobileBottomNav;
