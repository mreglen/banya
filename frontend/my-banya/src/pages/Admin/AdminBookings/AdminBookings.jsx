// src/pages/Admin/Bookings/AdminBookings.jsx

import { useState } from 'react';
import { useGetBookingsQuery, useMarkBookingAsReadMutation } from '../../../redux/slices/apiSlice';

function AdminBookings() {
  const [markAsRead] = useMarkBookingAsReadMutation();
  const [expandedNotes, setExpandedNotes] = useState(new Set());

  const { data: bookings = [], isLoading, error } = useGetBookingsQuery();

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
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-500">Загрузка заявок...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        ❌ Ошибка загрузки заявок: {error.message || 'Неизвестная ошибка'}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Заявки с сайта</h2>
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            Нет заявок
          </div>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking.booking_id}
              className={`border rounded-xl p-6 transition-all ${
                booking.isUnread
                  ? 'border-blue-300 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {booking.isUnread && (
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    )}
                    <h3 className="font-medium text-gray-800">
                      {booking.name} — {booking.formattedDate}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {booking.phone} | {booking.email || '—'}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkAsRead(booking.booking_id)}
                    disabled={booking.is_read}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
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
          ))
        )}
      </div>
    </div>
  );
}

export default AdminBookings;