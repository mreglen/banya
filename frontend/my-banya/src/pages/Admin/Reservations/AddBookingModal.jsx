import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import {
  useGetBathsQuery,
} from '../../../redux/slices/apiSlice';
import {
  useGetStockProductsQuery,
  useGetUnitsOfMeasurementQuery, // ← ДОБАВЛЕНО
} from '../../../redux/slices/productsApiSlice';
import {
  useCreateReservationMutation,
  useUpdateReservationMutation,
  useGetReservationStatusesQuery,
} from '../../../redux/slices/reservationSlice';

import ProductSelectionModal from '../../Admin/Documents/DocumentsEntrance/ProductSelectionModal';

const generateTimeOptions = () => {
  const options = [];
  for (let hour = 9; hour <= 23; hour++) {
    options.push(`${hour.toString().padStart(2, '0')}:00`);
    options.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return options;
};

function AddBookingModal({ isOpen, onClose, booking, selectedDate }) {
  const isEditing = !!booking;
  const [updateReservation] = useUpdateReservationMutation();
  const [createReservation, { isLoading: isCreating }] = useCreateReservationMutation();

  const [formData, setFormData] = useState({
    bath_id: '',
    date: selectedDate || '',
    start_time: '09:00',
    end_time: '10:00',
    client_name: '',
    client_phone: '',
    client_email: '',
    notes: '',
    guests: 1,
    status_id: 1,
    selectedProducts: [],
  });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const { data: baths = [], isLoading: isLoadingBaths } = useGetBathsQuery();
  const { data: stockProducts = [] } = useGetStockProductsQuery();
  const { data: units = [], isLoading: isLoadingUnits } = useGetUnitsOfMeasurementQuery(); // ← ДОБАВЛЕНО
  const {
    data: statusOptions = [],
    isLoading: isLoadingStatuses,
    error: statusesError
  } = useGetReservationStatusesQuery();

  // ← ДОБАВЛЕНО: функция поиска единицы измерения
  const findUnitName = (unitId) => {
    if (!unitId) return 'шт.';
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.name : 'шт.';
  };

  useEffect(() => {
    if (!isEditing && selectedDate) {
      setFormData((prev) => ({
        ...prev,
        date: selectedDate,
        start_time: '09:00',
        end_time: '10:00',
      }));
    }
  }, [selectedDate, isEditing]);

  useEffect(() => {
    if (booking && statusOptions.length > 0) {
      const start = new Date(booking.start_datetime);
      const end = new Date(booking.end_datetime);
      const date = start.toISOString().split('T')[0];
      const start_time = start.toTimeString().slice(0, 5);
      const end_time = end.toTimeString().slice(0, 5);

      const selectedProducts = (booking.products || []).map(product => {
        const stockItem = stockProducts.find(p => p.id === product.product_id);
        const unitName = findUnitName(stockItem?.unit_id); // ← ДОБАВЛЕНО
        return {
          id: product.product_id,
          name: product.name,
          purchase_price: product.purchase_price || 0,
          available: stockItem?.total_quantity || 0,
          unit_id: stockItem?.unit_id || null, // ← ДОБАВЛЕНО
          unit_name: unitName, // ← ДОБАВЛЕНО
          quantity: product.quantity,
        };
      });

      const statusIdFromBooking = booking.status?.id ?? booking.status_id;
      setFormData({
        bath_id: booking.bath?.bath_id || booking.bath_id || '',
        date,
        start_time,
        end_time,
        client_name: booking.client_name || '',
        client_phone: booking.client_phone || '',
        client_email: booking.client_email || '',
        notes: booking.notes || '',
        guests: booking.guests || 1,
        status_id: parseInt(statusIdFromBooking, 10) || 1,
        selectedProducts,
      });
    }
  }, [booking, stockProducts, units, findUnitName, statusOptions.length]); // ← ДОБАВЛЕНО units

  useEffect(() => {
    if (formData.end_time <= formData.start_time) {
      const options = getEndTimeOptions(formData.start_time);
      if (options.length > 0) {
        setFormData(prev => ({ ...prev, end_time: options[0] }));
      }
    }
  }, [formData.start_time, formData.end_time]);

  const getEndTimeOptions = (startTime) => {
    const allOptions = generateTimeOptions();
    return allOptions.filter(time => time > startTime);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Форматирование номера телефона
    if (name === 'client_phone') {
      const formatted = formatPhoneInput(value, formData.client_phone);
      setFormData((prev) => ({ ...prev, client_phone: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Форматирование телефона при вводе: +7 (XXX) XXX-XX-XX
  const formatPhoneInput = (value, prevValue) => {
    // Удаляем все нецифровые символы
    const digits = value.replace(/\D/g, '');
    
    // Если удалили всё
    if (!digits) return '';
    
    // Определяем, удаляет ли пользователь символы
    const isDeleting = value.length < prevValue.length;
    
    // Если удаляем, просто возвращаем значение
    if (isDeleting) return value;
    
    // Ограничиваем 11 цифрами
    const limitedDigits = digits.slice(0, 11);
    
    // Формируем отформатированный номер
    let formatted = '+7';
    
    if (limitedDigits.length > 1) {
      formatted += ' (' + limitedDigits.slice(1, 4);
    }
    if (limitedDigits.length > 4) {
      formatted += ') ' + limitedDigits.slice(4, 7);
    }
    if (limitedDigits.length > 7) {
      formatted += '-' + limitedDigits.slice(7, 9);
    }
    if (limitedDigits.length > 9) {
      formatted += '-' + limitedDigits.slice(9, 11);
    }
    
    return formatted;
  };

  const handleStatusChange = (e) => {
    setFormData((prev) => ({ ...prev, status_id: parseInt(e.target.value, 10) }));
  };

  const handleSelectProduct = (product) => {
    const existing = formData.selectedProducts.find(p => p.id === product.id);
    if (existing) {
      console.warn('Товар уже добавлен');
      return;
    }

    const stockItem = stockProducts.find(p => p.id === product.id);
    const available = stockItem?.total_quantity || 0;
    const unitName = findUnitName(stockItem?.unit_id); // ← ДОБАВЛЕНО

    setFormData(prev => ({
      ...prev,
      selectedProducts: [
        ...prev.selectedProducts,
        {
          id: product.id,
          name: product.name,
          purchase_price: product.last_purchase_price || 0,
          available,
          unit_id: stockItem?.unit_id || null, // ← ДОБАВЛЕНО
          unit_name: unitName, // ← ДОБАВЛЕНО
          quantity: 1,
        }
      ]
    }));
  };

  const updateProductQuantity = (productId, newQty) => {
    // Разрешаем пустое значение (когда пользователь стирает всё)
    const qty = newQty === '' ? '' : Math.max(1, Math.min(formData.selectedProducts.find(p => p.id === productId)?.available || 1, parseInt(newQty) || 1));
    
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(p =>
        p.id === productId
          ? { ...p, quantity: qty }
          : p
      )
    }));
  };

  const handleQuantityBlur = (productId) => {
    // При потере фокуса, если поле пустое, устанавливаем 1
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(p =>
        p.id === productId && (p.quantity === '' || p.quantity === null)
          ? { ...p, quantity: 1 }
          : p
      )
    }));
  };

  const removeProduct = (productId) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter(p => p.id !== productId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔵 Form submitted');

    const start_datetime = `${formData.date}T${formData.start_time}`;
    const end_datetime = `${formData.date}T${formData.end_time}`;
    console.log('🟡 Datetime:', { start_datetime, end_datetime });

    // Валидация обязательных полей
    if (!formData.bath_id) {
      console.warn('Validation failed: no bath_id');
      return;
    }

    if (!formData.client_name || formData.client_name.trim() === '') {
      console.warn('Validation failed: no client_name');
      return;
    }

    if (!formData.client_phone || formData.client_phone.trim() === '') {
      console.warn('Validation failed: no client_phone');
      return;
    }

    if (new Date(start_datetime) >= new Date(end_datetime)) {
      console.warn('Validation failed: end <= start');
      return;
    }

    // Нормализуем телефон перед отправкой
    let normalizedPhone = formData.client_phone;
    if (formData.client_phone) {
      const phoneDigits = formData.client_phone.replace(/\D/g, '');
      if (phoneDigits.length === 11 && phoneDigits.startsWith('7')) {
        normalizedPhone = '+' + phoneDigits;
      } else if (phoneDigits.length === 10) {
        normalizedPhone = '+7' + phoneDigits;
      } else if (phoneDigits.length === 11 && phoneDigits.startsWith('8')) {
        normalizedPhone = '+7' + phoneDigits.slice(1);
      } else if (phoneDigits.length < 10) {
        console.warn('Validation failed: invalid phone');
        return;
      }
    }

    const payload = {
      bath_id: parseInt(formData.bath_id),
      start_datetime,
      end_datetime,
      client_name: formData.client_name.trim(),
      client_phone: normalizedPhone,
      client_email: formData.client_email && formData.client_email.trim() !== '' ? formData.client_email.trim() : null,
      notes: formData.notes && formData.notes.trim() !== '' ? formData.notes.trim() : null,
      guests: parseInt(formData.guests) || 1,
      status_id: parseInt(formData.status_id) || 1,
      products: formData.selectedProducts.map(p => ({
        product_id: p.id,
        quantity: parseInt(p.quantity) || 1
      })),
    };

    console.log('🟢 Payload:', payload);

    try {
      console.log('🚀 Sending request...');
      if (isEditing) {
        const updatedReservation = await updateReservation({
          id: booking.reservation_id,
          ...payload,
        }).unwrap();

        const statusObj = statusOptions.find(s => s.id === formData.status_id);
        const updatedStatus = statusObj ? statusObj.status_name : 'Неизвестно';

        const updatedBooking = {
          ...booking,
          ...updatedReservation,
          status: updatedStatus,
          status_id: formData.status_id
        };

        onClose(updatedBooking);
      } else {
        await createReservation(payload).unwrap();
        console.log('✅ Reservation created successfully');
        onClose();
      }
    } catch (error) {
      console.error('❌ Error:', error);
      let message = isEditing ? 'Не удалось обновить бронь' : 'Не удалось создать бронь';
      if (error.data?.detail) {
        // Если ошибка валидации от backend, показываем её
        if (Array.isArray(error.data.detail)) {
          message = error.data.detail.map(err => err.msg || err.message).join('\n');
        } else {
          message = error.data.detail;
        }
      }
      console.error('❌ ' + message);
    }
  };

  if (!isOpen) return null;

  const totalProductCost = formData.selectedProducts.reduce(
    (sum, p) => sum + p.quantity * p.purchase_price,
    0
  );

  // ... (весь импорт и хуки остаются без изменений)

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-0 sm:p-4 z-50 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-4xl h-[100dvh] sm:max-h-[95vh] sm:h-auto flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 relative flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            {isEditing ? 'Редактировать бронь' : 'Добавить бронь'}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow">
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">

          {/* Статус */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
            {isLoadingStatuses ? (
              <div className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl bg-gray-100 text-sm">
                Загрузка статусов...
              </div>
            ) : statusesError ? (
              <div className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-red-300 rounded-xl bg-red-50 text-red-800 text-sm">
                Ошибка загрузки статусов
              </div>
            ) : (
              <select
                value={formData.status_id}
                onChange={handleStatusChange}
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                disabled={isLoadingStatuses}
              >
                {statusOptions.length === 0 ? (
                  <option>Нет статусов</option>
                ) : (
                  statusOptions.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.status_name}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* Баня */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Баня *</label>
            {isLoadingBaths ? (
              <div className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl bg-gray-100 text-sm">
                Загрузка...
              </div>
            ) : (
              <select
                name="bath_id"
                value={formData.bath_id}
                onChange={handleChange}
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                required
              >
                <option value="">Выберите баню</option>
                {baths.map((bath) => (
                  <option key={bath.bath_id} value={bath.bath_id}>
                    {bath.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Дата и время */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Дата *</label>
              <input
                type="date"
                value={formData.date}
                disabled={!isEditing}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Начало *</label>
              <select
                value={formData.start_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                required
              >
                {generateTimeOptions().map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Окончание *</label>
              <select
                value={formData.end_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                required
              >
                {getEndTimeOptions(formData.start_time).map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Имя клиента */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Имя клиента *</label>
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              placeholder="Иван Иванов"
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              required
            />
          </div>

          {/* Гости */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Количество гостей *</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                type="number"
                name="guests"
                min="1"
                value={formData.guests}
                onChange={handleChange}
                className="w-full max-w-[120px] px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
              {formData.bath_id && (
                <div className="text-xs sm:text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                  {(() => {
                    const selectedBath = baths.find((b) => b.bath_id === formData.bath_id);
                    if (!selectedBath) return null;
                    return (
                      <>
                        Входит: <strong>{selectedBath.base_guests}</strong> чел.
                        {selectedBath.extra_guest_price > 0 && (
                          <> | Доп. гость: <strong>{selectedBath.extra_guest_price} ₽</strong></>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Телефон и Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Телефон *</label>
              <input
                type="tel"
                name="client_phone"
                value={formData.client_phone}
                onChange={handleChange}
                placeholder="+7 (999) 123-45-67"
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="client_email"
                value={formData.client_email}
                onChange={handleChange}
                placeholder="ivan@example.com"
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Комментарий */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Комментарий</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              placeholder="Пожелания клиента..."
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* ========== СЕКЦИЯ ТОВАРОВ ========== */}
          <div className="border-t pt-4 sm:pt-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3">Товары (опционально)</h3>
            <button
              type="button"
              onClick={() => setIsProductModalOpen(true)}
              className="mb-3 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded text-sm sm:text-base hover:bg-blue-700"
            >
              Добавить товар
            </button>

            {/* Список товаров со скроллом */}
            {formData.selectedProducts.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-3 mb-3 pr-1">
                {formData.selectedProducts.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="font-medium text-gray-800">{item.name}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Доступно: {item.available} {item.unit_name}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">Кол-во:</span>
                        <input
                          type="number"
                          min="1"
                          max={item.available}
                          value={item.quantity}
                          onChange={(e) => updateProductQuantity(item.id, e.target.value)}
                          onBlur={() => handleQuantityBlur(item.id)}
                          className="w-14 px-2 py-1 border rounded text-sm"
                        />
                        <span className="text-sm text-gray-600">{item.unit_name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{(item.quantity * item.purchase_price).toFixed(2)} ₽</div>
                        <button
                          type="button"
                          onClick={() => removeProduct(item.id)}
                          className="text-red-600 text-xs hover:underline mt-1"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.selectedProducts.length > 0 && (
              <div className="pt-3 border-t border-gray-200 text-right font-semibold text-gray-800">
                Итого по товарам: {totalProductCost.toFixed(2)} ₽
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isCreating || isLoadingUnits}
              className="flex-1 bg-green-600 text-white py-2.5 sm:py-3 px-4 rounded-xl font-medium text-sm sm:text-base hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Сохранение...' : isEditing ? 'Сохранить изменения' : 'Создать бронь'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2.5 sm:py-3 px-4 rounded-xl font-medium text-sm sm:text-base hover:bg-gray-300 transition"
            >
              {isEditing ? 'Назад к просмотру' : 'Отмена'}
            </button>
          </div>
        </div>
        </form>

        {isProductModalOpen && (
          <ProductSelectionModal
            isOpen={true}
            onClose={() => setIsProductModalOpen(false)}
            onSelect={handleSelectProduct}
          />
        )}
      </div>
    </div>,
    document.body
  );
}

export default AddBookingModal;