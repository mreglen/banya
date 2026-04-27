// src/pages/Admin/Bookings/AdminBookings.jsx

import { useState } from 'react';
import { useGetBookingsQuery, useMarkBookingAsReadMutation } from '../../../redux/slices/apiSlice';
import AdminBookingsSkeleton from './AdminBookingsSkeleton';

function AdminBookings() {
  const [markAsRead] = useMarkBookingAsReadMutation();
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const [showReadBookings, setShowReadBookings] = useState(false);

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

  const toggleNote = (bookingId) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  // Функция для обрезки текста до 100 символов
  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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

  const renderBookingCard = (booking, extraClassName = '') => (
    <div
      key={booking.booking_id}
      className={`border rounded-lg md:rounded-xl p-4 md:p-6 transition-all ${extraClassName} ${
        booking.isUnread
          ? 'border-blue-300 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {booking.isUnread && (
              <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></span>
            )}
            <h3 className="font-medium text-gray-800 text-sm md:text-base">
              {booking.name} — {booking.formattedDate}
            </h3>
          </div>
          <p className="text-xs md:text-sm text-gray-600 mb-1">
            {booking.phone} | {booking.email || '—'}
          </p>
          <p className="text-xs md:text-sm text-gray-600 mb-1">
            Баня: {booking.bath?.name || '—'} | {booking.duration_hours} ч. | {booking.guests} гостей
          </p>
          {booking.notes && (
            <div className="mt-2">
              <p
                className="text-sm text-gray-700 italic"
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto'
                }}
              >
                <strong>Примечание:</strong>{' '}
                {expandedNotes.has(booking.booking_id)
                  ? booking.notes
                  : truncateText(booking.notes)
                }
              </p>
              {booking.notes.length > 100 && (
                <button
                  onClick={() => toggleNote(booking.booking_id)}
                  className="text-blue-600 hover:text-blue-800 text-xs mt-1 underline"
                >
                  {expandedNotes.has(booking.booking_id) ? 'Свернуть' : 'Показать полностью'}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3 md:mt-0">
          <button
            onClick={() => handleMarkAsRead(booking.booking_id)}
            disabled={booking.is_read}
            className={`w-full md:w-auto px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition min-h-[44px] ${
              booking.is_read
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {booking.is_read ? 'Прочитано' : 'Отметить как прочитанное'}
          </button>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        Отправлено: {booking.formattedTime}
      </div>
    </div>
  );

  return (
    <div className="p-2 md:p-8">
      <div className="bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-200 p-4 md:p-8">
        <h2 className="text-lg md:text-2xl font-semibold text-gray-800 mb-4 md:mb-6">Заявки с сайта</h2>
        <div className="space-y-4">
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
    </div>
  );
}

export default AdminBookings;