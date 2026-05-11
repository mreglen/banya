// src/pages/Admin/Documents/DocumentsRealization/RealizationDetailsModal.jsx
import { useGetReservationByIdQuery } from '../../../../redux/slices/reservationSlice';

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMoney(value) {
  return `${Number(value || 0).toFixed(2)} ₽`;
}

function RealizationDetailsModal({ isOpen, onClose, reservation }) {
  if (!isOpen || !reservation) return null;

  const { data: bookingDetails, isLoading: isBookingLoading } = useGetReservationByIdQuery(
    reservation.reservation_id,
    { skip: !reservation?.reservation_id }
  );

  const docProducts = reservation.items || [];
  const bookingProducts = bookingDetails?.products || [];
  const massages = bookingDetails?.massages || [];
  const promotion = bookingDetails?.promotion_snapshot;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Документ реализации #{reservation.id}</h2>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong className="text-gray-600">Клиент:</strong>
              <p className="mt-1 text-gray-900">{bookingDetails?.client_name || reservation.client_name || '—'}</p>
            </div>
            <div>
              <strong className="text-gray-600">Телефон:</strong>
              <p className="mt-1 text-gray-900">{bookingDetails?.client_phone || reservation.client_phone || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong className="text-gray-600">Email:</strong>
              <p className="mt-1 text-gray-900">{bookingDetails?.client_email || '—'}</p>
            </div>
            <div>
              <strong className="text-gray-600">Гостей:</strong>
              <p className="mt-1 text-gray-900">{bookingDetails?.guests ?? '—'}</p>
            </div>
          </div>
          
          <div>
            <strong className="text-gray-600">Дата документа:</strong>
            <p className="mt-1 text-gray-900">
              {new Date(reservation.date).toLocaleDateString('ru-RU')}
            </p>
          </div>
          
          <div>
            <strong className="text-gray-600">Бронь №:</strong>
            <p className="mt-1 text-gray-900">{reservation.reservation_id}</p>
          </div>

          <div>
            <strong className="text-gray-600">Баня:</strong>
            <p className="mt-1 text-gray-900">{reservation.bath_name || '—'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong className="text-gray-600">Начало брони:</strong>
              <p className="mt-1 text-gray-900">{formatDateTime(bookingDetails?.start_datetime)}</p>
            </div>
            <div>
              <strong className="text-gray-600">Окончание брони:</strong>
              <p className="mt-1 text-gray-900">{formatDateTime(bookingDetails?.end_datetime)}</p>
            </div>
          </div>

          <div>
            <strong className="text-gray-600">Статус:</strong>
            <p className="mt-1 text-gray-900">{bookingDetails?.status || '—'}</p>
          </div>

          <div>
            <strong className="text-gray-600">Комментарий:</strong>
            <p className="mt-1 text-gray-900 whitespace-pre-wrap break-words">{bookingDetails?.notes || '—'}</p>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <strong className="text-gray-600">Итого:</strong>
            <p className="mt-1 text-2xl font-bold text-gray-900">{reservation.total_amount.toFixed(2)} ₽</p>
          </div>

          {isBookingLoading && (
            <div className="text-xs text-gray-500">Загрузка подробностей брони...</div>
          )}
        </div>

        {/* Позиции из документа реализации */}
        {docProducts.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Позиции документа реализации</h3>
            <table className="w-full text-sm">
              <thead className="bg-white border border-gray-200 rounded-lg">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Товар</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Кол-во</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Цена</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Итого</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {docProducts.map((item, idx) => (
                  <tr key={idx} className="bg-white">
                    <td className="px-4 py-3">{item.product?.name || 'Товар'}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{item.price.toFixed(2)} ₽</td>
                    <td className="px-4 py-3 font-medium">{(item.quantity * item.price).toFixed(2)} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Все позиции по брони */}
        <div className="p-6 bg-white border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Все позиции по брони</h3>

          {bookingProducts.length > 0 ? (
            <div className="space-y-2">
              {bookingProducts.map((item, idx) => (
                <div key={`booking-product-${idx}`} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.name || 'Товар'}</p>
                    <p className="text-xs text-gray-500">Кол-во: {item.quantity || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-700">{formatMoney(item.price ?? item.purchase_price ?? 0)}</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatMoney((item.price ?? item.purchase_price ?? 0) * (item.quantity || 0))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Товары по брони отсутствуют.</p>
          )}

          {massages.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-800 mb-2">Массажи</h4>
              <div className="space-y-2">
                {massages.map((m, idx) => (
                  <div key={`massage-${idx}`} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                    <div>
                      <p className="font-medium text-gray-900">{m.name || 'Массаж'}</p>
                      <p className="text-xs text-gray-500">Кол-во: {m.quantity || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-700">{formatMoney(m.cost || 0)}</p>
                      <p className="text-sm font-semibold text-gray-900">{formatMoney((m.cost || 0) * (m.quantity || 0))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {promotion && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="font-medium text-green-800">Акция: {promotion.name || '—'}</p>
              {promotion.bonus_minutes ? (
                <p className="text-sm text-green-700 mt-1">Бонусное время: +{promotion.bonus_minutes} мин</p>
              ) : null}
              {(promotion.gift_products || []).length > 0 && (
                <div className="mt-2 text-sm text-green-700">
                  {(promotion.gift_products || []).map((gift, idx) => (
                    <p key={`gift-${idx}`}>{gift.product_name} x {gift.quantity}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export default RealizationDetailsModal;