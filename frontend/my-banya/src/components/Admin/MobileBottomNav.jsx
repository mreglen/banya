import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  FileMinus2,
  Globe,
  Package,
  FileText,
  LayoutDashboard,
  Wallet,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import { useAdminNav } from '../../hooks/useAdminNav';
import { isNavPathActive } from '../../config/adminNavConfig';
import { useUnreadBookingsCount } from '../../hooks/useUnreadBookingsCount';
import MobileMoreSheet from './MobileMoreSheet';

const ICONS = {
  realization: FileMinus2,
  bookings: Globe,
  storage: Package,
  documents: FileText,
  summary: LayoutDashboard,
  finance: Wallet,
  system: ShieldCheck,
};

function MobileBottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { user, bottomNavItems, moreSections } = useAdminNav();
  const unreadBookingsCount = useUnreadBookingsCount();

  const isMoreActive = Object.values(moreSections).some((items) =>
    items.some((item) => isNavPathActive(location.pathname, item))
  );

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch h-16">
          {bottomNavItems.map((item) => {
            const Icon = ICONS[item.id] || FileText;
            const active = isNavPathActive(location.pathname, item);
            const badge =
              item.badge === 'bookings' && unreadBookingsCount > 0
                ? unreadBookingsCount
                : 0;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={`relative flex flex-col items-center justify-center flex-1 min-w-0 px-1 transition-colors ${
                  active
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                }`}
                aria-label={item.label}
              >
                <div className="relative mb-0.5">
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[1rem] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium truncate max-w-full leading-tight">
                  {item.label}
                </span>
              </NavLink>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 min-w-0 px-1 transition-colors ${
              isMoreActive
                ? 'text-green-600 bg-green-50'
                : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
            }`}
            aria-label="Ещё"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium">Ещё</span>
          </button>
        </div>
      </nav>

      <MobileMoreSheet
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        user={user}
        moreSections={moreSections}
      />
    </>
  );
}

export default MobileBottomNav;
