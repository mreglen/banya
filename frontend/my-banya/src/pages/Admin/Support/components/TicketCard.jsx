import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

function TicketCard({ ticket, isAdmin }) {
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        label: 'В обработке',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      },
      closed: {
        label: 'Закрыт',
        className: 'bg-red-100 text-red-800 border-red-200',
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full border ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'dd MMMM yyyy, HH:mm', { locale: ru });
  };

  return (
    <Link
      to={`/admin/support/ticket/${ticket.id}`}
      className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-1 hover:text-indigo-600 transition">
              {ticket.title}
            </h3>
            {isAdmin && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>{ticket.user_full_name}</span>
                <span className="text-gray-400">•</span>
                <span className="text-xs">{ticket.user_email}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(ticket.status)}
          </div>
        </div>

        <div className="flex items-center justify-end text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{formatDate(ticket.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default TicketCard;
