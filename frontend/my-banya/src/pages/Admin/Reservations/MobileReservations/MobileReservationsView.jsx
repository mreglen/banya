// src/pages/Admin/Reservations/MobileReservationsView.jsx
import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

function MobileReservationsView({ baths, onEdit, onDelete, onView }) {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm', { locale: ru });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'в ожидании': return 'bg-yellow-100 text-yellow-800';
      case 'в работе': return 'bg-blue-100 text-blue-800';
      case 'выполнен': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {baths.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Нет доступных бань</div>
      ) : (
        baths.map((bath) => (
          <div key={bath.bath_id} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">{bath.bathName}</h3>
            </div>
            <div className="p-4">
              {bath.bookings.length === 0 ? (
                <p className="text-green-600 font-medium">Свободно весь день</p>
              ) : (
                <div className="space-y-4">
                  {bath.bookings
                    .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))
                    .map((booking) => (
                      <div
                        key={booking.reservation_id}
                        className={`p-4 rounded-lg border ${
                          booking.is_cleaning
                            ? 'bg-indigo-50 border-indigo-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {booking.is_cleaning ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-indigo-800">Уборка</div>
                              <div className="text-sm text-indigo-600">
                                {formatTime(booking.start_datetime)} – {formatTime(booking.end_datetime)}
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                              Уборка
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-gray-900 mb-1">
                              {booking.client_name || '—'}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              📞 {booking.client_phone || '—'}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              💬 {booking.notes || 'Без комментария'}
                            </div>
                            <div className="text-sm font-medium text-gray-800 mb-2">
                              ⏰ {formatTime(booking.start_datetime)} – {formatTime(booking.end_datetime)}
                            </div>
                            <div className="text-lg font-bold text-gray-900 mb-3">
                              {booking.total_cost} ₽
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(booking.status)}`}>
                                Статус: {booking.status || '—'}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => onView(booking)}
                                className="flex-1 bg-blue-100 text-blue-800 py-1.5 rounded text-sm font-medium hover:bg-blue-200 transition"
                              >
                                Просмотр
                              </button>
                              <button
                                onClick={() => onEdit(booking)}
                                className="flex-1 bg-green-100 text-green-800 py-1.5 rounded text-sm font-medium hover:bg-green-200 transition"
                              >
                                Редактировать
                              </button>
                              <button
                                onClick={() => onDelete(booking.reservation_id)}
                                className="flex-1 bg-red-100 text-red-800 py-1.5 rounded text-sm font-medium hover:bg-red-200 transition"
                              >
                                Удалить
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default MobileReservationsView;