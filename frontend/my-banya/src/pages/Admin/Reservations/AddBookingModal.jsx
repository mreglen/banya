import { createPortal } from 'react-dom';
import { useEffect, useState, useRef } from 'react';
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
  for (let hour = 0; hour <= 23; hour++) {
    options.push(`${hour.toString().padStart(2, '0')}:00`);
    options.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return options;
};

const formatLocalYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatLocalHm = (date) => {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

/** Округление вверх до 30 минут (локальное время) */
const roundUpTo30Min = (date) => {
  const d = new Date(date.getTime());
  d.setSeconds(0, 0);
  const m = d.getMinutes();
  const rem = m % 30;
  if (rem === 0) return d;
  d.setMinutes(m + (30 - rem), 0, 0);
  return d;
};

/** Первый доступный слот времени начала для выбранной даты (локально) */
const getFirstAllowedStartTime = (ymd) => {
  const today = formatLocalYmd(new Date());
  if (ymd !== today) return '00:00';
  return formatLocalHm(roundUpTo30Min(new Date()));
};

/** Конец брони по дате/времени начала и длительности в часах (может перейти через полночь) */
const computeEndDateTime = (ymd, hm, durationHours) => {
  const start = new Date(`${ymd}T${hm}:00`);
  const end = new Date(start.getTime() + Number(durationHours) * 60 * 60 * 1000);
  return { endDate: formatLocalYmd(end), endHm: formatLocalHm(end) };
};

const addDaysYmd = (ymd, days) => {
  const [y, mo, d] = String(ymd).split('-').map(Number);
  const dt = new Date(y, mo - 1, d, 12, 0, 0, 0);
  dt.setDate(dt.getDate() + days);
  return formatLocalYmd(dt);
};

// Build ISO string with timezone offset (Python datetime.fromisoformat supports it)
const toLocalIsoWithOffset = (ymd, hm) => {
  const dt = new Date(`${ymd}T${hm}:00`);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  const ss = String(dt.getSeconds()).padStart(2, '0');

  // JS offset: minutes behind UTC (e.g. Екатеринбург UTC+5 => -300)
  const offsetMin = -dt.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const offH = String(Math.floor(abs / 60)).padStart(2, '0');
  const offM = String(abs % 60).padStart(2, '0');

  return `${y}-${m}-${d}T${hh}:${mm}:${ss}${sign}${offH}:${offM}`;
};

function AddBookingModal({ isOpen, onClose, booking, selectedDate, onEditSuccess }) {
  const isEditing = !!booking;
  const today = formatLocalYmd(new Date());
  const [updateReservation, { isLoading: isUpdating }] = useUpdateReservationMutation();
  const [createReservation, { isLoading: isCreating }] = useCreateReservationMutation();

  let initialNewDate =
    selectedDate && String(selectedDate).trim() !== '' ? String(selectedDate) : today;
  let initialNewStartTime = getFirstAllowedStartTime(initialNewDate);
  if (initialNewDate === today) {
    const slots = generateTimeOptions().filter((t) => t >= initialNewStartTime);
    if (slots.length === 0) {
      initialNewDate = addDaysYmd(today, 1);
      initialNewStartTime = '00:00';
    }
  }

  const [formData, setFormData] = useState({
    bath_id: '',
    date: initialNewDate,
    start_time: initialNewStartTime,
    duration_hours: 1,
    client_name: '',
    client_phone: '',
    client_email: '',
    notes: '',
    guests: 1,
    status_id: 1,
    selectedProducts: [],
  });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [toast, setToast] = useState(null);
  const prevIsOpenRef = useRef(false);

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

  // Функция показа toast-уведомлений
  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // При открытии модалки «новая бронь» — сброс к выбранной в фильтре дате и валидному времени
  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (!justOpened || !isOpen || isEditing) return;

    let date =
      selectedDate && String(selectedDate).trim() !== '' ? String(selectedDate) : formatLocalYmd(new Date());
    let start_time = getFirstAllowedStartTime(date);
    const todayStr = formatLocalYmd(new Date());
    if (date === todayStr) {
      const slots = generateTimeOptions().filter((t) => t >= start_time);
      if (slots.length === 0) {
        date = addDaysYmd(todayStr, 1);
        start_time = '00:00';
      }
    }
    setFormData((prev) => ({
      ...prev,
      date,
      start_time,
      duration_hours: 1,
      bath_id: '',
      client_name: '',
      client_phone: '',
      client_email: '',
      notes: '',
      guests: 1,
      status_id: 1,
      selectedProducts: [],
    }));
  }, [isOpen, isEditing, selectedDate]);

  useEffect(() => {
    if (booking && statusOptions.length > 0) {
      try {
        const start = new Date(booking.start_datetime);
        const end = new Date(booking.end_datetime);
        const date = formatLocalYmd(start);
        const start_time = start.toTimeString().slice(0, 5);
        const diffMs = end.getTime() - start.getTime();
        const duration_hours = Math.max(0.5, Math.round((diffMs / (1000 * 60 * 60)) * 2) / 2);

        const selectedProducts = (booking.products || []).map(product => {
          const stockItem = stockProducts.find(p => p.id === product.product_id);
          const unitName = findUnitName(stockItem?.unit_id); // ← ДОБАВЛЕНО
          return {
            id: product.product_id,
            name: product.name,
            price: product.price ?? product.purchase_price ?? 0,
            available: stockItem?.total_quantity || 0,
            unit_id: stockItem?.unit_id || null, // ← ДОБАВЛЕНО
            unit_name: unitName, // ← ДОБАВЛЕНО
            is_countable: stockItem?.is_countable ?? true,
            quantity: product.quantity,
          };
        });

        const statusIdFromBooking = booking.status?.id ?? booking.status_id;
        setFormData({
          bath_id: booking.bath?.bath_id || booking.bath_id || '',
          date,
          start_time,
          duration_hours,
          client_name: booking.client_name || '',
          client_phone: booking.client_phone || '',
          client_email: booking.client_email || '',
          notes: booking.notes || '',
          guests: booking.guests || 1,
          status_id: parseInt(statusIdFromBooking, 10) || 1,
          selectedProducts,
        });
      } catch (error) {
        console.error('Ошибка загрузки данных брони:', error);
        showToast('Ошибка загрузки данных для редактирования', 'error');
      }
    }
  }, [booking, stockProducts, units, findUnitName, statusOptions.length]); // ← ДОБАВЛЕНО units

  // Если выбрана сегодняшняя дата — не даём оставить время в прошлом
  useEffect(() => {
    const todayStr = formatLocalYmd(new Date());
    if (formData.date !== todayStr) return;
    const minHm = getFirstAllowedStartTime(formData.date);
    const slots = generateTimeOptions().filter((t) => t >= minHm);
    if (slots.length === 0) {
      setFormData((prev) => ({
        ...prev,
        date: addDaysYmd(todayStr, 1),
        start_time: '00:00',
      }));
      return;
    }
    if (formData.start_time < minHm) {
      setFormData((prev) => ({ ...prev, start_time: minHm }));
    }
  }, [formData.date, formData.start_time]);

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
    } else if (name === 'duration_hours') {
      if (value === '') {
        setFormData((prev) => ({ ...prev, duration_hours: '' }));
      } else {
        const n = parseFloat(value);
        setFormData((prev) => ({ ...prev, duration_hours: Number.isNaN(n) ? prev.duration_hours : n }));
      }
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
    const isCountable = stockItem?.is_countable ?? true;

    setFormData(prev => ({
      ...prev,
      selectedProducts: [
        ...prev.selectedProducts,
        {
          id: product.id,
          name: product.name,
          price: product.price ?? product.last_purchase_price ?? 0,
          available,
          unit_id: stockItem?.unit_id || null, // ← ДОБАВЛЕНО
          unit_name: unitName, // ← ДОБАВЛЕНО
          is_countable: isCountable,
          quantity: 1,
        }
      ]
    }));
  };

  const updateProductQuantity = (productId, newQty) => {
    if (newQty !== '' && !/^\d+$/.test(newQty)) return;
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(p =>
        p.id === productId
          ? { ...p, quantity: newQty === '' ? '' : parseInt(newQty, 10) }
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

  // Функция валидации формы
  const validateForm = () => {
    const errors = {};
    
    // Проверка бани
    if (!formData.bath_id) {
      errors.bath_id = 'Выберите баню';
    }
    
    // Проверка имени клиента
    if (!formData.client_name || formData.client_name.trim() === '') {
      errors.client_name = 'Введите имя клиента';
    }
    
    // Проверка телефона - должен содержать 11 цифр
    const phoneDigits = formData.client_phone.replace(/\D/g, '');
    if (!formData.client_phone) {
      errors.client_phone = 'Введите номер телефона';
    } else if (phoneDigits.length < 11) {
      errors.client_phone = `Номер введён не полностью (введено ${phoneDigits.length} из 11 цифр)`;
    }
    
    // Проверка email (если введён)
    if (formData.client_email && formData.client_email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.client_email)) {
        errors.client_email = 'Неверный формат email';
      }
    }
    
    const minDateStr = formatLocalYmd(new Date());
    if (formData.date < minDateStr) {
      errors.date = 'Нельзя выбрать дату в прошлом';
    }

    const dh =
      formData.duration_hours === '' || formData.duration_hours == null
        ? NaN
        : Number(formData.duration_hours);
    if (Number.isNaN(dh) || dh < 0.5) {
      errors.duration_hours = 'Минимум 0.5 часа';
    } else {
      const stepped = Math.round(dh * 2) / 2;
      if (Math.abs(dh - stepped) > 1e-6) {
        errors.duration_hours = 'Шаг 0.5 часа (например 1, 1.5, 2)';
      }
    }

    const start_iso = toLocalIsoWithOffset(formData.date, formData.start_time);
    const { endDate, endHm } = computeEndDateTime(
      formData.date,
      formData.start_time,
      Number.isNaN(dh) ? 0 : dh
    );
    const end_iso = toLocalIsoWithOffset(endDate, endHm);

    if (new Date(start_iso) >= new Date(end_iso)) {
      errors.duration_hours = 'Укажите положительную длительность';
    }

    if (new Date(start_iso) < new Date()) {
      errors.start_time = 'Нельзя выбрать прошедшее время начала';
    }
    
    // Проверка количества гостей
    if (!formData.guests || formData.guests < 1) {
      errors.guests = 'Минимум 1 гость';
    }
    
    // Проверка товаров (количество)
    formData.selectedProducts.forEach(product => {
      const q = product.quantity;
      const qNum = typeof q === 'number' ? q : parseInt(q, 10);
      if (q === '' || q === null || Number.isNaN(qNum) || qNum < 1) {
        errors[`product_${product.id}`] = 'Минимум 1';
      } else if (product.is_countable !== false && qNum > product.available) {
        errors[`product_${product.id}`] = `Превышает доступное количество (${product.available})`;
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateDurationHint = () => {
    const dh =
      formData.duration_hours === '' || formData.duration_hours == null
        ? NaN
        : Number(formData.duration_hours);
    if (Number.isNaN(dh) || dh < 0.5) return 'Укажите длительность (от 0.5 ч, шаг 0.5)';

    const start = new Date(`${formData.date}T${formData.start_time}:00`);
    const { endDate, endHm } = computeEndDateTime(formData.date, formData.start_time, dh);
    const end = new Date(`${endDate}T${endHm}:00`);
    const diffMs = end - start;
    if (diffMs <= 0) return 'Проверьте длительность';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const endLabel = end.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let dur = '';
    if (diffDays > 0) {
      dur =
        diffHours === 0 && diffMinutes === 0
          ? `${diffDays} дн.`
          : `${diffDays} дн. ${diffHours} ч ${diffMinutes} мин`;
    } else if (diffHours === 0) {
      dur = `${diffMinutes} мин`;
    } else if (diffMinutes === 0) {
      dur = `${diffHours} ч`;
    } else {
      dur = `${diffHours} ч ${diffMinutes} мин`;
    }

    const crosses = endDate !== formData.date;
    return { dur, endLabel, crosses };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔵 Form submitted');

    // Сбрасываем предыдущие ошибки
    setValidationErrors({});

    // Запускаем валидацию
    if (!validateForm()) {
      console.warn('❌ Validation failed');
      return;
    }

    const dh = Number(formData.duration_hours);
    const { endDate, endHm } = computeEndDateTime(formData.date, formData.start_time, dh);
    const start_datetime = toLocalIsoWithOffset(formData.date, formData.start_time);
    const end_datetime = toLocalIsoWithOffset(endDate, endHm);
    console.log('🟡 Datetime:', { start_datetime, end_datetime });

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
        await updateReservation({
          id: booking.reservation_id,
          ...payload,
        }).unwrap();

        showToast('Бронь успешно обновлена', 'success');
        
        if (onEditSuccess) {
          onEditSuccess();
        } else {
          onClose();
        }
      } else {
        await createReservation(payload).unwrap();
        console.log('✅ Reservation created successfully');
        showToast('Бронь успешно создана', 'success');
        setTimeout(() => onClose(), 1000); // Закрыть через 1 секунду
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
      showToast(message, 'error');
    }
  };

  if (!isOpen) return null;
  const isSubmitting = isCreating || isUpdating;

  const totalProductCost = formData.selectedProducts.reduce(
    (sum, p) => sum + (parseInt(p.quantity, 10) || 0) * (p.price ?? p.purchase_price ?? 0),
    0
  );

  const minDateStr = formatLocalYmd(new Date());
  const allTimeSlots = generateTimeOptions();
  const minStartHmForToday = getFirstAllowedStartTime(formData.date);
  let startTimeOptions =
    formData.date === minDateStr
      ? allTimeSlots.filter((t) => t >= minStartHmForToday)
      : allTimeSlots;
  if (startTimeOptions.length === 0) {
    startTimeOptions = ['00:00'];
  }

  const durationHint = calculateDurationHint();

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-0 sm:p-4 z-50 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-4xl h-[100dvh] sm:max-h-[95vh] sm:h-auto flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
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
              <>
                <select
                  name="bath_id"
                  value={formData.bath_id}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 text-sm sm:text-base ${
                    validationErrors.bath_id 
                      ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                >
                  <option value="">Выберите баню</option>
                  {baths.map((bath) => (
                    <option key={bath.bath_id} value={bath.bath_id}>
                      {bath.name}
                    </option>
                  ))}
                </select>
                {validationErrors.bath_id && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <span>⚠</span> {validationErrors.bath_id}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Дата и время */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Дата начала *</label>
              <input
                type="date"
                value={formData.date}
                min={minDateStr}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData((prev) => {
                    const next = { ...prev, date: v };
                    if (v === minDateStr) {
                      const minHm = getFirstAllowedStartTime(v);
                      if (next.start_time < minHm) next.start_time = minHm;
                    }
                    return next;
                  });
                }}
                className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm ${
                  validationErrors.date ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
              {validationErrors.date && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {validationErrors.date}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Время начала *</label>
              <select
                value={formData.start_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 text-sm sm:text-base ${
                  validationErrors.start_time
                    ? 'border-red-500 focus:ring-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                required
              >
                {startTimeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {validationErrors.start_time && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {validationErrors.start_time}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Количество часов * <span className="text-gray-500 font-normal">(шаг 0.5)</span>
              </label>
              <input
                type="number"
                name="duration_hours"
                min="0.5"
                step="0.5"
                value={formData.duration_hours}
                onChange={handleChange}
                onBlur={() => {
                  const n = Number(formData.duration_hours);
                  if (Number.isNaN(n) || n < 0.5) return;
                  const stepped = Math.round(n * 2) / 2;
                  setFormData((prev) => ({ ...prev, duration_hours: stepped }));
                }}
                className={`w-full max-w-[200px] px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 text-sm ${
                  validationErrors.duration_hours
                    ? 'border-red-500 focus:ring-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                required
              />
              {validationErrors.duration_hours && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {validationErrors.duration_hours}
                </p>
              )}
            </div>
          </div>

          {/* Подсказка о длительности */}
          <div
            className={`text-xs px-3 py-2 rounded-lg ${
              typeof durationHint === 'object' && durationHint?.crosses
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'bg-blue-50 text-gray-600'
            }`}
          >
            {typeof durationHint === 'object' && durationHint?.crosses && (
              <div className="font-medium mb-1">Бронирование переходит на следующий день</div>
            )}
            <div>
              {typeof durationHint === 'string' ? (
                durationHint
              ) : (
                <>
                  Длительность: <strong>{durationHint.dur}</strong>
                  <span className="mx-1">·</span>
                  Окончание: <strong>{durationHint.endLabel}</strong>
                </>
              )}
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
              className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 text-sm sm:text-base ${
                validationErrors.client_name 
                  ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              required
            />
            {validationErrors.client_name && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <span>⚠</span> {validationErrors.client_name}
              </p>
            )}
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
                    // `select` возвращает строку, а `bath_id` в данных обычно число — приводим типы
                    const selectedBath = baths.find(
                      (b) => String(b.bath_id) === String(formData.bath_id)
                    );
                    if (!selectedBath) return null;
                    const baseGuests = Number(selectedBath.base_guests) || 0;
                    const guestsNum = Number(formData.guests) || 0;
                    const extraGuestsCount = Math.max(0, guestsNum - baseGuests);
                    const extraPrice = Number(selectedBath.extra_guest_price) || 0;
                    const extraTotal = extraGuestsCount * extraPrice;
                    return (
                      <>
                        Входит: <strong>{baseGuests}</strong> чел.
                        {extraGuestsCount > 0 && (
                          <>
                            | Доп. гости ({extraGuestsCount} × {extraPrice} ₽):{' '}
                            <strong>{extraTotal.toLocaleString()}</strong> ₽
                          </>
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
                className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 text-sm ${
                  validationErrors.client_phone 
                    ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                required
              />
              {validationErrors.client_phone && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {validationErrors.client_phone}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="client_email"
                value={formData.client_email}
                onChange={handleChange}
                placeholder="ivan@example.com"
                className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 text-sm ${
                  validationErrors.client_email 
                    ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {validationErrors.client_email && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {validationErrors.client_email}
                </p>
              )}
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
                    {item.is_countable !== false ? (
                      <div className="text-xs text-gray-600 mt-1">
                        Доступно: {item.available} {item.unit_name}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600 mt-1">
                        Не исчисляемая позиция (например, услуга) — количество без ограничения по остатку
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">Кол-во:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="\d*"
                          value={item.quantity}
                          onChange={(e) => updateProductQuantity(item.id, e.target.value)}
                          className={`w-16 px-2 py-1 border rounded text-sm ${
                            validationErrors[`product_${item.id}`]
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300'
                          }`}
                        />
                        <span className="text-sm text-gray-600">{item.unit_name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {((parseInt(item.quantity, 10) || 0) * (item.price ?? item.purchase_price ?? 0)).toFixed(2)} ₽
                        </div>
                        {/* Показывать ошибку валидации */}
                        {validationErrors[`product_${item.id}`] && (
                          <p className="text-xs text-red-600 mt-1">{validationErrors[`product_${item.id}`]}</p>
                        )}
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

        <div
          className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isSubmitting || isLoadingUnits}
              className="flex-1 bg-green-600 text-white py-2.5 sm:py-3 px-4 rounded-xl font-medium text-sm sm:text-base hover:bg-green-700 active:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Сохранение...' : isEditing ? 'Сохранить изменения' : 'Создать бронь'}
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

        {/* Toast уведомления */}
        {toast && (
          <div className={`fixed top-4 right-4 z-[60] p-4 rounded-lg shadow-lg max-w-sm ${
            toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}>
            <div className="flex items-start gap-2">
              <span className="text-xl">{toast.type === 'error' ? '❌' : '✅'}</span>
              <p className="text-sm">{toast.message}</p>
              <button onClick={() => setToast(null)} className="ml-2 text-lg">×</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default AddBookingModal;