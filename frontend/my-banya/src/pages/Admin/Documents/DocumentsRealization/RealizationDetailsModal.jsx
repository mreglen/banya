// src/pages/Admin/Documents/DocumentsRealization/RealizationDetailsModal.jsx

function RealizationDetailsModal({ isOpen, onClose, reservation }) {
  if (!isOpen || !reservation) return null;

  // reservation - это теперь документ реализации с полями:
  // id, date, reservation_id, client_name, client_phone, total_amount, items
  const products = reservation.items || [];

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
              <p className="mt-1 text-gray-900">{reservation.client_name}</p>
            </div>
            <div>
              <strong className="text-gray-600">Телефон:</strong>
              <p className="mt-1 text-gray-900">{reservation.client_phone}</p>
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
          
          <div className="pt-4 border-t border-gray-200">
            <strong className="text-gray-600">Итого:</strong>
            <p className="mt-1 text-2xl font-bold text-gray-900">{reservation.total_amount.toFixed(2)} ₽</p>
          </div>
        </div>

        {/* Список товаров */}
        {products.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Товары</h3>
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
                {products.map((item, idx) => (
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