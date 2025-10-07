// src/pages/Admin/Reservations/BookingDetailsModal.jsx

import { useState, useEffect } from 'react';
import { useGetBathsQuery } from '../../../redux/slices/apiSlice';
import AddBookingModal from './AddBookingModal';

function BookingDetailsModal({ booking, onClose, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const { data: baths = [], isLoading: isLoadingBaths } = useGetBathsQuery();

  // Сброс режима при смене брони
  useEffect(() => {
    setIsEditing(false);
  }, [booking]);

  if (!booking) return null;

  const bath = baths.find(b => b.bath_id === booking.bath_id);
  const bathName = bath?.name || 'Баня не найдена';

  // 🧮 Рассчитываем стоимость услуг
  const broomsTotal = (booking.brooms || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const menuItemsTotal = (booking.menu_items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const massagesTotal = (booking.massages || []).reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  const bathOnlyCost = booking.total_cost - broomsTotal - menuItemsTotal - massagesTotal;

  // 🔁 Переключиться обратно к просмотру
  const handleBackToView = () => {
    setIsEditing(false);
  };

  // ✅ После успешного редактирования — закрыть всё
  const handleEditSuccess = () => {
    onClose(); // или можно обновить данные и остаться в просмотре
  };

  if (isEditing) {
    return (
      <AddBookingModal
        isOpen={true}
        // 🔁 Закрытие = возврат к просмотру, а не полное закрытие
        onClose={handleBackToView}
        booking={booking}
        // Опционально: передать колбэк на успех
        onEditSuccess={handleEditSuccess}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Детали брони</h2>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm">
          <div><strong>Клиент:</strong> {booking.client_name}</div>
          <div><strong>Телефон:</strong> {booking.client_phone}</div>
          {booking.client_email && <div><strong>Email:</strong> {booking.client_email}</div>}
          <div><strong>Баня:</strong> {bathName}</div>
          <div><strong>Гостей:</strong> {booking.guests}</div>
          <div>
            <strong>Время:</strong>{' '}
            {new Date(booking.start_datetime).toLocaleString('ru-RU')} —{' '}
            {new Date(booking.end_datetime).toLocaleString('ru-RU')}
          </div>
          {booking.notes && <div><strong>Комментарий:</strong> {booking.notes}</div>}
          <div><strong>Статус:</strong> {booking.status}</div>
        </div>

        {/* 💰 Чек */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Чек</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Баня ({bathName}):</span>
              <strong>{bathOnlyCost.toLocaleString()} ₽</strong>
            </div>
            {booking.guests > bath?.base_guests && (
              <div className="flex justify-between text-gray-600 pl-4">
                <span>
                  Доп. гости ({booking.guests - bath.base_guests} × {bath.extra_guest_price} ₽):
                </span>
                <span>
                  {((booking.guests - bath.base_guests) * bath.extra_guest_price).toLocaleString()} ₽
                </span>
              </div>
            )}
            {booking.brooms?.length > 0 && (
              <>
                <div className="pt-2 border-t border-gray-200 mt-2"><span className="font-medium">Веники:</span></div>
                {booking.brooms.map((broom, idx) => (
                  <div key={idx} className="flex justify-between pl-4 text-gray-600">
                    <span>{broom.name} × {broom.quantity}</span>
                    <span>{(broom.price * broom.quantity).toLocaleString()} ₽</span>
                  </div>
                ))}
              </>
            )}

            {booking.massages?.length > 0 && (
              <>
                <div className="pt-2 border-t border-gray-200 mt-2"><span className="font-medium">Массажи:</span></div>
                {booking.massages.map((massage, idx) => (
                  <div key={idx} className="flex justify-between pl-4 text-gray-600">
                    <span>{massage.name} × {massage.quantity}</span>
                    <span>{(massage.cost * massage.quantity).toLocaleString()} ₽</span>
                  </div>
                ))}
              </>
            )}

            {booking.menu_items?.length > 0 && (
              <>
                <div className="pt-2 border-t border-gray-200 mt-2"><span className="font-medium">Блюда:</span></div>
                {booking.menu_items.map((item, idx) => (
                  <div key={idx} className="flex justify-between pl-4 text-gray-600">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{(item.price * item.quantity).toLocaleString()} ₽</span>
                  </div>
                ))}
              </>
            )}

            <hr className="my-3 border-gray-300" />
            <div className="flex justify-between font-bold text-lg">
              <span>Итого к оплате:</span>
              <span className="text-green-600">{booking.total_cost.toLocaleString()} ₽</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Редактировать
          </button>
          <button
            onClick={() => {
              if (window.confirm('Удалить бронь?')) {
                onDelete(booking.reservation_id);
                onClose(); // закрыть после удаления
              }
            }}
            className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition font-medium"
          >
            Удалить
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingDetailsModal;