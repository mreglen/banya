// src/pages/Admin/Bookings/AdminBookings.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetBookingsQuery, useMarkBookingAsReadMutation } from '../../../redux/slices/apiSlice';
import AdminBookingsSkeleton from './AdminBookingsSkeleton';
import AddBookingModal from '../Reservations/AddBookingModal';

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

  const renderBookingCard = (booking, extraClassName = '') => (
    <div
      key={booking.booking_id}
      className={`rounded-2xl p-4 transition-all ${extraClassName} ${
        booking.isUnread
          ? 'border-2 border-blue-200 bg-blue-50/50 shadow-sm'
          : 'border border-gray-200 bg-white shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">{booking.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{booking.formattedDate}</p>
        </div>
        {booking.isUnread && (
          <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
            NEW
          </span>
        )}
      </div>
      <div className="text-xs text-gray-600 space-y-1 mb-3">
        <p>{booking.phone}</p>
        <p>{booking.bath?.name || '—'} · {booking.duration_hours} ч · {booking.guests} гост.</p>
      </div>
      {booking.notes && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{booking.notes}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setBookingToConfirm(booking);
            setIsConfirmModalOpen(true);
          }}
          className="min-h-[44px] rounded-xl bg-blue-600 text-white text-sm font-medium"
        >
          Подтвердить
        </button>
        <button
          type="button"
          onClick={() => handleMarkAsRead(booking.booking_id)}
          disabled={booking.is_read}
          className={`min-h-[44px] rounded-xl text-sm font-medium ${
            booking.is_read
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {booking.is_read ? 'Прочитано' : 'Прочитать'}
        </button>
      </div>
    </div>
  );

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
          selectedDate={bookingToConfirm.date}
          prefillData={{
            bath_id: bookingToConfirm.bath_id,
            date: bookingToConfirm.date,
            start_time: '12:00',
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
              state: { selectedDate: createdReservation?.selected_date || bookingToConfirm.date },
            });
          }}
        />
      )}
    </div>
  );
}

export default AdminBookings;