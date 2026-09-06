// src/pages/Admin/Bookings/AdminBookings.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetBookingsQuery, useMarkBookingAsReadMutation } from '../../../redux/slices/apiSlice';
import AdminBookingsSkeleton from './AdminBookingsSkeleton';
import AddBookingModal from '../Reservations/AddBookingModal';
import { formatYmdToRu, toYmd } from '../../../utils/dateLocal';

function formatSubmittedAt(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatVisitDate(booking) {
  const dateLabel = booking.formattedDate || formatYmdToRu(booking.date);
  if (!booking.start_time) return dateLabel;
  return `${dateLabel} · ${booking.start_time}`;
}

function AdminBookings() {
  const navigate = useNavigate();
  const [markAsRead] = useMarkBookingAsReadMutation();
  const [showReadBookings, setShowReadBookings] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bookingToConfirm, setBookingToConfirm] = useState(null);

  const { data: bookings = [], isLoading, error } = useGetBookingsQuery();
  const unreadBookings = bookings.filter((booking) => !booking.is_read);
  const readBookings = bookings.filter((booking) => booking.is_read);

  const handleMarkAsRead = async (bookingId) => {
    try {
      await markAsRead(bookingId).unwrap();
    } catch (err) {
      console.error('Ошибка при отметке заявки как прочитанной:', err);
    }
  };

  if (isLoading) {
    return <AdminBookingsSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <svg className="inline-block w-5 h-5 mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Ошибка загрузки заявок: {error.message || 'Неизвестная ошибка'}
      </div>
    );
  }

  const renderBookingCard = (booking, extraClassName = '') => {
    const isUnread = !booking.is_read;

    return (
    <div
      key={booking.booking_id}
      className={`rounded-2xl p-4 sm:p-5 transition-all ${extraClassName} ${
        isUnread
          ? 'border-2 border-blue-200 bg-blue-50/50 shadow-sm'
          : 'border border-gray-200 bg-white shadow-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-5">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3 sm:block">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug break-words">
              {booking.name}
            </h3>
            {isUnread && (
              <span className="sm:hidden flex-shrink-0 mt-0.5 px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold tracking-wide">
                NEW
              </span>
            )}
          </div>

          <a
            href={`tel:${booking.phone}`}
            className="inline-flex items-center text-base sm:text-[17px] font-semibold text-gray-900 hover:text-blue-700"
          >
            {booking.phone}
          </a>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/80 border border-gray-200 text-sm font-semibold text-gray-800">
              {booking.bath?.name || 'Баня не указана'}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/80 border border-gray-200 text-sm font-semibold text-gray-800">
              {booking.duration_hours} ч
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/80 border border-gray-200 text-sm font-semibold text-gray-800">
              {booking.guests} гост.
            </span>
          </div>

          {booking.notes && (
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {booking.notes}
            </p>
          )}
        </div>

        <div className="sm:w-52 shrink-0 sm:text-right space-y-1.5 sm:pt-1">
          {isUnread && (
            <div className="hidden sm:flex justify-end mb-2">
              <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold tracking-wide">
                NEW
              </span>
            </div>
          )}
          <p className="text-sm text-gray-700">
            <span className="text-gray-500">дата заезда:</span>{' '}
            <span className="font-semibold text-gray-900">{formatVisitDate(booking)}</span>
          </p>
          <p className="text-sm text-gray-500">
            отправлена: {formatSubmittedAt(booking.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200/80">
        <button
          type="button"
          onClick={() => {
            setBookingToConfirm(booking);
            setIsConfirmModalOpen(true);
          }}
          className="min-h-[36px] px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          Подтвердить
        </button>
        <button
          type="button"
          onClick={() => handleMarkAsRead(booking.booking_id)}
          disabled={booking.is_read}
          className={`min-h-[36px] px-3 py-2 rounded-lg text-sm font-medium ${
            booking.is_read
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          {booking.is_read ? 'Прочитано' : 'Прочитать'}
        </button>
      </div>
    </div>
    );
  };

  return (
    <div className="md:p-8">
      <div className="md:bg-white md:rounded-2xl md:shadow-md md:border md:border-gray-200 md:p-8">
        <h2 className="hidden md:block text-lg md:text-2xl font-semibold text-gray-800 mb-4 md:mb-6">Заявки с сайта</h2>
        <div className="space-y-3 md:space-y-4">
          {bookings.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              Нет заявок
            </div>
          ) : (
            <>
              {unreadBookings.length > 0 ? (
                unreadBookings.map((booking) => renderBookingCard(booking))
              ) : (
                <div className="text-gray-500 text-center py-6 border border-dashed rounded-lg">
                  Непрочитанных заявок нет
                </div>
              )}

              {readBookings.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowReadBookings((prev) => !prev)}
                    className="w-full md:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                  >
                    {showReadBookings ? 'Скрыть прочитанные' : `Показать прочитанные (${readBookings.length})`}
                  </button>

                  {showReadBookings && (
                    <div className="mt-3 space-y-4">
                      {readBookings.map((booking) => renderBookingCard(booking, 'opacity-90'))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isConfirmModalOpen && bookingToConfirm && (
        <AddBookingModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setBookingToConfirm(null);
          }}
          selectedDate={toYmd(bookingToConfirm.date)}
          prefillData={{
            bath_id: bookingToConfirm.bath_id,
            date: toYmd(bookingToConfirm.date),
            start_time: bookingToConfirm.start_time || '12:00',
            duration_hours: bookingToConfirm.duration_hours || 1,
            client_name: bookingToConfirm.name,
            client_phone: bookingToConfirm.phone,
            notes: bookingToConfirm.notes,
            guests: bookingToConfirm.guests || 1,
          }}
          onCreateSuccess={async (createdReservation) => {
            await handleMarkAsRead(bookingToConfirm.booking_id);
            setIsConfirmModalOpen(false);
            setBookingToConfirm(null);
            navigate('/admin/reservations', {
              state: {
                selectedDate:
                  createdReservation?.selected_date || toYmd(bookingToConfirm.date),
              },
            });
          }}
        />
      )}
    </div>
  );
}

export default AdminBookings;