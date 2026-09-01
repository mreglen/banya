import { NavLink } from 'react-router-dom';
import {
  DollarSign,
  Calendar,
  MousePointer2,
  FileMinus2,
  Wallet,
  Package,
  ChevronRight,
} from 'lucide-react';
import { useHasAccess } from '../../hooks/useHasAccess';

function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(value || 0);
}

function MobileAdminSummary({ stats, recentActivity, userName, greeting }) {
  const hasAccess = useHasAccess();

  const kpiCards = [
    {
      label: 'Выручка',
      value: formatCurrency(stats?.revenue?.today || 0),
      sub: `${formatCurrency(stats?.revenue?.this_week || 0)} / нед`,
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Брони',
      value: stats?.reservations?.today || 0,
      sub: `${stats?.reservations?.this_week || 0} / нед`,
      icon: Calendar,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Заявки',
      value: stats?.bookings?.unread || 0,
      sub: `${stats?.bookings?.this_month ?? stats?.bookings?.total ?? 0} / мес`,
      icon: MousePointer2,
      color: 'text-orange-600 bg-orange-50',
      to: hasAccess('bookings:view') ? '/admin/bookings' : null,
    },
  ];

  const quickLinks = [
    hasAccess('documents:view') && {
      to: '/admin/documents/realization',
      label: 'Реализация',
      icon: FileMinus2,
    },
    hasAccess('finance:view') && {
      to: '/admin/finance',
      label: 'Финансы',
      icon: Wallet,
    },
    hasAccess('storage:view') && {
      to: '/admin/storage/nomenclature',
      label: 'Склад',
      icon: Package,
    },
  ].filter(Boolean);

  return (
    <div className="md:hidden space-y-4 pb-4">
      <div>
        <p className="text-xs text-gray-500">{greeting}</p>
        <h1 className="text-xl font-bold text-gray-900 truncate">{userName}</h1>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-gray-500 mt-2">{card.label}</p>
              <p className="text-lg font-bold text-gray-900 leading-tight">{card.value}</p>
              <p className="text-[10px] text-gray-400">{card.sub}</p>
            </>
          );

          if (card.to) {
            return (
              <NavLink
                key={card.label}
                to={card.to}
                className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm active:scale-[0.98] transition"
              >
                {content}
              </NavLink>
            );
          }

          return (
            <div key={card.label} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
              {content}
            </div>
          );
        })}
      </div>

      {quickLinks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {quickLinks.map((link, idx) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 min-h-[52px] px-4 py-3 active:bg-gray-50 ${
                  idx > 0 ? 'border-t border-gray-100' : ''
                }`}
              >
                <Icon className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="flex-1 text-sm font-medium text-gray-900">{link.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </NavLink>
            );
          })}
        </div>
      )}

      {recentActivity?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Недавнее
          </p>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="text-sm">
                <p className="text-gray-900 font-medium line-clamp-2">
                  {activity.summary || activity.action}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(activity.created_at).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileAdminSummary;
