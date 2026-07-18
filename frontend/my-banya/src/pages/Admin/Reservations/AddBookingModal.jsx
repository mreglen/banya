import { createPortal } from 'react-dom';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
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
  useGetReservationsByDateQuery,
} from '../../../redux/slices/reservationSlice';
import { useGetPaymentQrCodeQuery } from '../../../redux/slices/settingsApiSlice';

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

/** Конец брони по дате/времени начала и длительности в часах (может перейти через полночь) */
const computeEndDateTime = (ymd, hm, durationHours) => {
  const start = new Date(`${ymd}T${hm}:00`);
  const end = new Date(start.getTime() + Number(durationHours) * 60 * 60 * 1000);
  return { endDate: formatLocalYmd(end), endHm: formatLocalHm(end) };
};

const findApplicablePromotion = ({ bath, durationHours, guests, bathCost, startDate }) => {
  const promos = (bath?.promotions || []).filter((p) => p && p.is_active !== false);
  if (!promos.length || !startDate) return null;

  const bookingDate = formatLocalYmd(startDate);
  const weekday = ((startDate.getDay() + 6) % 7); // 0=пн … 6=вс

  const matched = promos.filter((promo) => {
    if (promo.valid_from && bookingDate < promo.valid_from) return false;
    if (promo.valid_until && bookingDate > promo.valid_until) return false;
    if (promo.min_hours != null && durationHours < Number(promo.min_hours)) return false;
    if (promo.min_guests != null && guests < Number(promo.min_guests)) return false;
    if (promo.min_amount != null && bathCost < Number(promo.min_amount)) return false;
    if (Array.isArray(promo.applicable_weekdays) && promo.applicable_weekdays.length > 0) {
      if (!promo.applicable_weekdays.includes(weekday)) return false;
    }
    return true;
  });

  if (!matched.length) return null;
  matched.sort((a, b) => {
    const score = (p) => (Number(p.bonus_minutes) || 0) * 1000 + (p.gift_products?.length || 0);
    return score(b) - score(a);
  });
  return matched[0];
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

/** Только цифры, без ведущих нулей; пустая строка если нечего показать */
const normalizeGuestsDigits = (raw) => {
  if (raw === '' || raw == null) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits === '') return '';
  return digits.replace(/^0+/, '') || '';
};

const formatReceiptMoney = (value) => `${(value || 0).toLocaleString('ru-RU')} ₽`;

const SERVER_BASE_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : (window.location.origin || 'http://127.0.0.1:8000');

const toPythonWeekday = (date) => (date.getDay() + 6) % 7;

/** API отдаёт status строкой; status_id может отсутствовать в старых ответах */
const resolveBookingStatusId = (bookingData, statusOptionsList) => {
  if (!bookingData) return 1;
  const directId = bookingData.status_id ?? bookingData.status?.id;
  if (directId != null && !Number.isNaN(Number(directId))) {
    return Number(directId);
  }
  const statusName =
    typeof bookingData.status === 'string'
      ? bookingData.status
      : bookingData.status?.status_name;
  if (statusName && statusOptionsList?.length) {
    const normalized = String(statusName).trim().toLowerCase();
    const found = statusOptionsList.find(
      (s) => String(s.status_name || '').trim().toLowerCase() === normalized
    );
    if (found?.id != null) return Number(found.id);
  }
  return 1;
};

function AddBookingModal({ isOpen, onClose, booking, selectedDate, onEditSuccess, onCreateSuccess, prefillData = null }) {
  const isEditing = !!booking;
  const today = formatLocalYmd(new Date());
  const currentUser = useSelector((state) => state.auth?.user);
  const permissionCodes = new Set((currentUser?.permissions || []).map((p) => p.code));
  const canManageReservation = Boolean(
    currentUser?.is_admin ||
    currentUser?.is_director ||
    permissionCodes.has('reservations:manage')
  );
  const isClosedBooking =
    isEditing && String(booking?.status || '').trim().toLowerCase() === 'закрыт';
  const canRevertClosed = !!(currentUser?.is_admin || currentUser?.is_director);
  const lockStatus = (isClosedBooking && !canRevertClosed) || !canManageReservation;
  const [updateReservation, { isLoading: isUpdating }] = useUpdateReservationMutation();
  const [createReservation, { isLoading: isCreating }] = useCreateReservationMutation();

  let initialNewDate =
    selectedDate && String(selectedDate).trim() !== '' ? String(selectedDate) : today;
  const initialNewStartTime = '12:00';

  const [formData, setFormData] = useState({
    bath_id: '',
    date: initialNewDate,
    start_time: initialNewStartTime,
    duration_hours: 1,
    client_name: '',
    client_phone: '',
    prepayment: '',
    notes: '',
    guests: '',
    status_id: 1,
    selectedProducts: [],
  });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentModalView, setPaymentModalView] = useState('choose');
  const { data: paymentQr } = useGetPaymentQrCodeQuery(undefined, {
    skip: !isPaymentModalOpen,
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [toast, setToast] = useState(null);
  const prevIsOpenRef = useRef(false);
  const dateInputRef = useRef(null);
  /** Чтобы при редактировании не сбрасывать форму при догрузке stock/units */
  const editFormHydratedForRef = useRef(null);

  const { data: baths = [], isLoading: isLoadingBaths } = useGetBathsQuery();
  const { data: stockProducts = [] } = useGetStockProductsQuery();
  const { data: units = [], isLoading: isLoadingUnits } = useGetUnitsOfMeasurementQuery(); // ← ДОБАВЛЕНО
  const {
    data: statusOptions = [],
    isLoading: isLoadingStatuses,
    error: statusesError
  } = useGetReservationStatusesQuery();
  const selectedBathIdNum = formData.bath_id ? Number(formData.bath_id) : null;
  const selectedBath = baths.find((bath) => Number(bath.bath_id) === selectedBathIdNum);
  const minBookingHours = Math.max(1, Number(selectedBath?.min_booking_hours) || 1);
  const { data: reservationsForDate = [] } = useGetReservationsByDateQuery(
    { date: formData.date, bathId: selectedBathIdNum },
    { skip: !isOpen || !formData.date || !selectedBathIdNum }
  );

  const findUnitName = useCallback((unitId) => {
    if (!unitId) return 'шт.';
    const unit = units.find((u) => u.id === unitId);
    return unit ? unit.name : 'шт.';
  }, [units]);

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
    const start_time = '12:00';
    setFormData((prev) => ({
      ...prev,
      date,
      start_time,
      duration_hours: 1,
      bath_id: '',
      client_name: '',
      client_phone: '',
      prepayment: '',
      notes: '',
      guests: '',
      status_id: 1,
      selectedProducts: [],
    }));
  }, [isOpen, isEditing, selectedDate]);

  useEffect(() => {
    if (!isOpen || isEditing || !prefillData) return;
    setFormData((prev) => ({
      ...prev,
      bath_id: prefillData.bath_id ? String(prefillData.bath_id) : prev.bath_id,
      date: prefillData.date || prev.date,
      start_time: prefillData.start_time || prev.start_time,
      duration_hours: prefillData.duration_hours || prev.duration_hours,
      client_name: prefillData.client_name || prev.client_name,
      client_phone: prefillData.client_phone || prev.client_phone,
      notes: prefillData.notes || prev.notes,
      guests: prefillData.guests ? String(prefillData.guests) : prev.guests,
      selectedProducts: [],
    }));
  }, [isOpen, isEditing, prefillData]);

  // Закрытие модалки по клавише Escape
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      editFormHydratedForRef.current = null;
      return;
    }
    if (!booking || statusOptions.length === 0) return;

    const rid = booking.reservation_id;
    const needsStock = (booking.products?.length ?? 0) > 0;
    if (needsStock && stockProducts.length === 0) return;

    if (editFormHydratedForRef.current === rid) return;
    editFormHydratedForRef.current = rid;

    try {
      const start = new Date(booking.start_datetime);
      const end = new Date(booking.end_datetime);
      const date = formatLocalYmd(start);
      const start_time = start.toTimeString().slice(0, 5);
      const diffMs = end.getTime() - start.getTime();
      const bonusMinutes = Number(booking.promotion_snapshot?.bonus_minutes) || 0;
      const paidMs = Math.max(diffMs - bonusMinutes * 60 * 1000, 30 * 60 * 1000);
      const duration_hours = Math.max(0.5, Math.round((paidMs / (1000 * 60 * 60)) * 2) / 2);

      const giftIds = new Set(
        (booking.promotion_snapshot?.gift_products || []).map((g) => Number(g.product_id))
      );
      const selectedProducts = (booking.products || [])
        .filter((product) => {
          const pid = Number(product.product_id);
          const price = Number(product.price ?? 0);
          // Подарки акции подтянем в чеке отдельно; в форме оставляем оплачиваемые позиции
          if (giftIds.has(pid) && price === 0) return false;
          return true;
        })
        .map((product) => {
        const pid = Number(product.product_id);
        const stockItem = stockProducts.find((p) => Number(p.id) === pid);
        const unitName = findUnitName(stockItem?.unit_id);
        return {
          id: pid,
          name: product.name,
          price: product.price ?? product.purchase_price ?? 0,
          available: stockItem?.total_quantity || 0,
          unit_id: stockItem?.unit_id || null,
          unit_name: unitName,
          is_countable: stockItem?.is_countable ?? true,
          quantity: product.quantity,
        };
      });

      const statusIdFromBooking = resolveBookingStatusId(booking, statusOptions);
      const guestsNorm =
        normalizeGuestsDigits(booking.guests ?? 1) || '1';

      setFormData({
        bath_id: booking.bath?.bath_id || booking.bath_id || '',
        date,
        start_time,
        duration_hours,
        client_name: booking.client_name || '',
        client_phone: booking.client_phone || '',
        prepayment: booking.prepayment != null && booking.prepayment > 0 ? String(booking.prepayment) : '',
        notes: booking.notes || '',
        guests: guestsNorm,
        status_id: statusIdFromBooking,
        selectedProducts,
      });
    } catch (error) {
      console.error('Ошибка загрузки данных брони:', error);
      showToast('Ошибка загрузки данных для редактирования', 'error');
    }
  }, [isOpen, booking, statusOptions.length, stockProducts, findUnitName]);

  // Если после выбора бани/даты текущее время занято — ставим ближайшее свободное
  useEffect(() => {
    if (!formData.bath_id) return;
    const allSlots = generateTimeOptions();
    const validSlots = allSlots.filter((time) => {
      const slotStart = new Date(`${formData.date}T${time}:00`);
      const isBusy = reservationsForDate.some((res) => {
        if (!res?.start_datetime || !res?.end_datetime) return false;
        if (isEditing && Number(res.reservation_id) === Number(booking?.reservation_id)) return false;
        const start = new Date(res.start_datetime);
        const end = new Date(res.end_datetime);
        return slotStart >= start && slotStart < end;
      });
      return !isBusy;
    });

    if (validSlots.length === 0) return;
    if (!validSlots.includes(formData.start_time)) {
      setFormData((prev) => ({ ...prev, start_time: validSlots[0] }));
    }
  }, [formData.bath_id, formData.date, formData.start_time, reservationsForDate, isEditing, booking]);

  const openDatePicker = () => {
    if (!dateInputRef.current) return;
    dateInputRef.current.focus();
    if (typeof dateInputRef.current.showPicker === 'function') {
      dateInputRef.current.showPicker();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Форматирование номера телефона
    if (name === 'client_phone') {
      const formatted = formatPhoneInput(value, formData.client_phone);
      setFormData((prev) => ({ ...prev, client_phone: formatted }));
    } else if (name === 'prepayment') {
      const digits = value.replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, prepayment: digits }));
    } else if (name === 'duration_hours') {
      if (value === '') {
        setFormData((prev) => ({ ...prev, duration_hours: '' }));
      } else {
        const n = parseFloat(value);
        setFormData((prev) => ({ ...prev, duration_hours: Number.isNaN(n) ? prev.duration_hours : n }));
      }
    } else if (name === 'bath_id') {
      const selected = baths.find((bath) => String(bath.bath_id) === String(value));
      const minHours = Math.max(1, Number(selected?.min_booking_hours) || 1);
      setFormData((prev) => ({
        ...prev,
        bath_id: value,
        duration_hours: Number(prev.duration_hours) < minHours ? minHours : prev.duration_hours,
      }));
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
    const pid = Number(product.id);
    setFormData((prev) => {
      const existing = prev.selectedProducts.find((p) => Number(p.id) === pid);
      if (existing) {
        console.warn('Товар уже добавлен');
        return prev;
      }

      const stockItem = stockProducts.find((p) => Number(p.id) === pid);
      const available = stockItem?.total_quantity || 0;
      const unitName = findUnitName(stockItem?.unit_id);
      const isCountable = stockItem?.is_countable ?? true;

      return {
        ...prev,
        selectedProducts: [
          ...prev.selectedProducts,
          {
            id: pid,
            name: product.name,
            price: product.price ?? product.last_purchase_price ?? 0,
            available,
            unit_id: stockItem?.unit_id || null,
            unit_name: unitName,
            is_countable: isCountable,
            quantity: 1,
          },
        ],
      };
    });
  };

  const updateProductQuantity = (productId, newQty) => {
    if (newQty !== '' && !/^\d+$/.test(newQty)) return;
    const pid = Number(productId);
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(p =>
        Number(p.id) === pid
          ? { ...p, quantity: newQty === '' ? '' : parseInt(newQty, 10) }
          : p
      )
    }));
  };

  const updateProductPrice = (productId, newPrice) => {
    if (newPrice !== '' && !/^\d*([.,]\d{0,2})?$/.test(newPrice)) return;
    const pid = Number(productId);
    const normalized = newPrice === '' ? '' : newPrice.replace(',', '.');
    setFormData((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map((p) =>
        Number(p.id) === pid ? { ...p, price: normalized } : p
      ),
    }));
  };

  const removeProduct = (productId) => {
    const pid = Number(productId);
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter(p => Number(p.id) !== pid)
    }));
  };

  const handleGuestsChange = (e) => {
    const v = e.target.value;
    if (v === '') {
      setFormData((prev) => ({ ...prev, guests: '' }));
      return;
    }
    const digitsOnly = v.replace(/\D/g, '');
    if (digitsOnly === '') {
      setFormData((prev) => ({ ...prev, guests: '' }));
      return;
    }
    const noLeading = digitsOnly.replace(/^0+/, '') || '';
    setFormData((prev) => ({ ...prev, guests: noLeading }));
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
    
    const prepaymentNum = formData.prepayment === '' ? 0 : parseInt(formData.prepayment, 10) || 0;
    if (formData.prepayment !== '' && prepaymentNum < 0) {
      errors.prepayment = 'Предоплата не может быть отрицательной';
    }

    const dh =
      formData.duration_hours === '' || formData.duration_hours == null
        ? NaN
        : Number(formData.duration_hours);
    if (Number.isNaN(dh) || dh < minBookingHours) {
      errors.duration_hours = `Минимум ${minBookingHours} ч. для выбранной бани`;
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

    const guestsNum = parseInt(formData.guests, 10);
    if (formData.guests === '' || Number.isNaN(guestsNum) || guestsNum < 1) {
      errors.guests = 'Минимум 1 гость';
    }
    
    // Проверка товаров: для неисчисляемых (услуги/массаж) — любое количество ≥1, остаток на складе не смотрим
    formData.selectedProducts.forEach((product) => {
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
    if (Number.isNaN(dh) || dh < minBookingHours) {
      return `Укажите длительность (от ${minBookingHours} ч, шаг 0.5)`;
    }

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
    if (!canManageReservation) {
      showToast('Недостаточно прав для управления бронированием', 'error');
      return;
    }
    console.log('🔵 Form submitted');

    // Сбрасываем предыдущие ошибки
    setValidationErrors({});

    // Запускаем валидацию
    if (!validateForm()) {
      console.warn('❌ Validation failed');
      return;
    }

    const prepaymentNum = formData.prepayment === '' ? 0 : parseInt(formData.prepayment, 10) || 0;
    if (receiptSummary.canCalculate && prepaymentNum > receiptSummary.totalCost) {
      setValidationErrors({ prepayment: 'Предоплата не может превышать сумму брони' });
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

    // Если бронь закрыта и у пользователя нет прав на откат — оставляем исходный status_id,
    // чтобы исключить случайную попытку смены статуса (бэкенд всё равно вернёт 403)
    const originalStatusId = resolveBookingStatusId(booking, statusOptions) ?? formData.status_id;
    const submitStatusId = lockStatus
      ? parseInt(originalStatusId, 10) || 1
      : parseInt(formData.status_id, 10) || 1;

    const payload = {
      bath_id: parseInt(formData.bath_id),
      start_datetime,
      end_datetime,
      client_name: formData.client_name.trim(),
      client_phone: normalizedPhone,
      prepayment: formData.prepayment === '' ? 0 : parseInt(formData.prepayment, 10) || 0,
      notes: formData.notes && formData.notes.trim() !== '' ? formData.notes.trim() : null,
      guests: parseInt(formData.guests, 10) || 1,
      status_id: submitStatusId,
      products: formData.selectedProducts.map((p) => ({
        product_id: Number(p.id),
        quantity: parseInt(p.quantity, 10) || 1,
        price: parseFloat(String(p.price ?? p.purchase_price ?? 0).replace(',', '.')) || 0,
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
        const createdReservation = await createReservation(payload).unwrap();
        console.log('✅ Reservation created successfully');
        showToast('Бронь успешно создана', 'success');
        setTimeout(() => {
          if (onCreateSuccess) {
            onCreateSuccess({
              ...createdReservation,
              selected_date: formData.date,
              selected_bath_id: Number(formData.bath_id),
            });
          } else {
            onClose();
          }
        }, 400);
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

  const handleOpenPaymentModal = () => {
    if (!isEditing || !booking?.reservation_id) return;
    setPaymentModalView('choose');
    setIsPaymentModalOpen(true);
  };

  const handleCashPayment = () => {
    if (!booking?.reservation_id) return;
    window.open(`/admin/reservations/print/${booking.reservation_id}?payment=cash`, '_blank', 'noopener,noreferrer');
    setIsPaymentModalOpen(false);
    setPaymentModalView('choose');
  };

  const handleQrPayment = () => {
    if (!booking?.reservation_id) return;
    setPaymentModalView('qr');
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setPaymentModalView('choose');
  };

  const paymentQrImageUrl = paymentQr?.image_url
    ? `${SERVER_BASE_URL}${paymentQr.image_url}`
    : null;

  const receiptSummary = useMemo(() => {
    if (!selectedBath || !formData.date || !formData.start_time) {
      return { canCalculate: false };
    }

    const durationHours = Number(formData.duration_hours);
    if (Number.isNaN(durationHours) || durationHours < minBookingHours) {
      return { canCalculate: false };
    }

    const start = new Date(`${formData.date}T${formData.start_time}:00`);
    const weekday = toPythonWeekday(start);
    const hourlyRate = weekday >= 4
      ? Number(selectedBath.cost_weekend) || 0
      : Number(selectedBath.cost_weekday) || 0;
    const bathBaseCost = Math.floor(hourlyRate * durationHours);
    const guestsNum = parseInt(formData.guests, 10) || 0;
    const baseGuests = Number(selectedBath.base_guests) || 0;
    const extraGuests = Math.max(0, guestsNum - baseGuests);
    const extraGuestPrice = Number(selectedBath.extra_guest_price) || 0;
    const extraGuestCost = extraGuests * extraGuestPrice;

    const productItems = formData.selectedProducts.map((p) => {
      const quantity = parseInt(p.quantity, 10) || 0;
      const unitPrice = parseFloat(String(p.price ?? p.purchase_price ?? 0).replace(',', '.')) || 0;
      return {
        name: p.name,
        quantity,
        unitPrice,
        lineTotal: quantity * unitPrice,
      };
    });
    const productTotal = productItems.reduce((sum, item) => sum + item.lineTotal, 0);

    const massageItems = (isEditing && booking?.massages ? booking.massages : []).map((m) => {
      const quantity = m.quantity || 0;
      const unitPrice = m.cost || 0;
      return {
        name: m.name,
        quantity,
        unitPrice,
        lineTotal: quantity * unitPrice,
      };
    });
    const massageTotal = massageItems.reduce((sum, item) => sum + item.lineTotal, 0);

    const bathServiceCost = bathBaseCost + extraGuestCost;

    const appliedPromotion = findApplicablePromotion({
      bath: selectedBath,
      durationHours,
      guests: guestsNum,
      bathCost: bathServiceCost,
      startDate: start,
    });
    const bonusMinutes = Number(appliedPromotion?.bonus_minutes) || 0;
    const giftItems = (appliedPromotion?.gift_products || []).map((gp) => ({
      name: gp.product_name || `Товар #${gp.product_id}`,
      quantity: gp.quantity || 1,
      unitPrice: 0,
      lineTotal: 0,
      isGift: true,
    }));

    const totalCost = bathServiceCost + productTotal + massageTotal;

    const paidEnd = computeEndDateTime(formData.date, formData.start_time, durationHours);
    const totalDurationHours = durationHours + bonusMinutes / 60;
    const { endDate, endHm } = computeEndDateTime(formData.date, formData.start_time, totalDurationHours);
    const endLabel = new Date(`${endDate}T${endHm}:00`).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const paidEndLabel = new Date(`${paidEnd.endDate}T${paidEnd.endHm}:00`).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      canCalculate: true,
      bathName: selectedBath.name,
      durationHours,
      hourlyRate,
      isWeekendRate: weekday >= 4,
      bathBaseCost,
      guestsNum,
      baseGuests,
      extraGuests,
      extraGuestPrice,
      extraGuestCost,
      bathServiceCost,
      productItems,
      productTotal,
      giftItems,
      massageItems,
      massageTotal,
      totalCost,
      appliedPromotion,
      bonusMinutes,
      paidEndLabel,
      startLabel: start.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      endLabel,
      clientName: formData.client_name || '—',
      clientPhone: formData.client_phone || '—',
    };
  }, [
    selectedBath,
    formData.date,
    formData.start_time,
    formData.duration_hours,
    formData.guests,
    formData.selectedProducts,
    formData.client_name,
    formData.client_phone,
    minBookingHours,
    isEditing,
    booking,
  ]);

  const allTimeSlots = generateTimeOptions();
  const busyStartTimes = new Set(
    (reservationsForDate || [])
      .filter((res) => {
        if (!res?.start_datetime || !res?.end_datetime) return false;
        if (isEditing && Number(res.reservation_id) === Number(booking?.reservation_id)) return false;
        return true;
      })
      .flatMap((res) => {
        const start = new Date(res.start_datetime);
        const end = new Date(res.end_datetime);
        return allTimeSlots.filter((time) => {
          const slotStart = new Date(`${formData.date}T${time}:00`);
          return slotStart >= start && slotStart < end;
        });
      })
  );
  let startTimeOptions = allTimeSlots;
  if (formData.bath_id) {
    startTimeOptions = startTimeOptions.filter((t) => !busyStartTimes.has(t));
  }

  const durationHint = calculateDurationHint();
  const isSubmitting = isCreating || isUpdating;
  const prepaymentAmount = formData.prepayment === '' ? 0 : parseInt(formData.prepayment, 10) || 0;

  return createPortal(
    !isOpen ? null : (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50 overflow-hidden"
    >
      <div
        className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-7xl h-[100dvh] sm:h-[95vh] sm:max-h-[95vh] flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 relative flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            {isEditing ? 'Редактировать бронь' : 'Добавить бронь'}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 w-11 h-11 sm:w-12 sm:h-12 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200 text-3xl sm:text-4xl leading-none flex items-center justify-center transition-colors"
            aria-label="Закрыть модалку"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto min-h-0 overscroll-contain">

          {/* Статус (только при редактировании) */}
          {isEditing && (
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Статус</label>
              {isLoadingStatuses ? (
                <div className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl bg-gray-100 text-base">
                  Загрузка статусов...
                </div>
              ) : statusesError ? (
                <div className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-red-300 rounded-xl bg-red-50 text-red-800 text-base">
                  Ошибка загрузки статусов
                </div>
              ) : (
                <>
                  <select
                    value={formData.status_id}
                    onChange={handleStatusChange}
                    className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-base sm:text-lg ${
                      lockStatus ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    disabled={isLoadingStatuses || lockStatus}
                    title={lockStatus ? 'Изменить статус закрытой брони может только администратор или директор' : undefined}
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
                  {lockStatus && (
                    <p className="mt-1 text-xs text-gray-500">
                      Бронь закрыта. Изменить статус может только администратор или директор.
                    </p>
                  )}
                </>
              )}
            </div>
          )}


          {/* Баня */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">Баня *</label>
            {isLoadingBaths ? (
              <div className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl bg-gray-100 text-base">
                Загрузка...
              </div>
            ) : (
              <>
                <select
                  name="bath_id"
                  value={formData.bath_id}
                  onChange={handleChange}
                  className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 text-base sm:text-lg ${
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
            <div
              className="cursor-pointer"
              onClick={openDatePicker}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openDatePicker();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <label className="block text-base font-medium text-gray-700 mb-2">Дата начала *</label>
              <input
                ref={dateInputRef}
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, date: e.target.value }));
                }}
                className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 text-base sm:text-lg ${
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
              <label className="block text-base font-medium text-gray-700 mb-2">Время начала *</label>
              <select
                value={formData.start_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 text-base sm:text-lg ${
                  validationErrors.start_time
                    ? 'border-red-500 focus:ring-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                disabled={formData.bath_id && startTimeOptions.length === 0}
                required
              >
                {startTimeOptions.length > 0 ? (
                  startTimeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))
                ) : (
                  <option value="">Нет свободного времени</option>
                )}
              </select>
              {validationErrors.start_time && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {validationErrors.start_time}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-base font-medium text-gray-700 mb-2">
                Количество часов * <span className="text-gray-500 font-normal">(шаг 0.5)</span>
              </label>
              {formData.bath_id && (
                <p className="mb-2 text-sm text-gray-600">
                  Минимально для этой бани: <strong>{minBookingHours}</strong> ч.
                </p>
              )}
              <input
                type="number"
                name="duration_hours"
                min={minBookingHours}
                step="0.5"
                value={formData.duration_hours}
                onChange={handleChange}
                onBlur={() => {
                  const n = Number(formData.duration_hours);
                  if (Number.isNaN(n) || n < minBookingHours) return;
                  const stepped = Math.round(n * 2) / 2;
                  setFormData((prev) => ({ ...prev, duration_hours: stepped }));
                }}
                className={`w-full max-w-[200px] px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 text-base sm:text-lg ${
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
            className={`text-sm px-3 py-2 rounded-lg ${
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
            <label className="block text-base font-medium text-gray-700 mb-2">Имя клиента *</label>
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              placeholder="Иван Иванов"
              className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 text-base sm:text-lg ${
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
            <label className="block text-base font-medium text-gray-700 mb-2">Количество гостей *</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                type="text"
                name="guests"
                inputMode="numeric"
                autoComplete="off"
                pattern="[0-9]*"
                placeholder="Например, 4"
                value={formData.guests}
                onChange={handleGuestsChange}
                className={`w-full max-w-[120px] px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 text-base sm:text-lg ${
                  validationErrors.guests
                    ? 'border-red-500 focus:ring-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {formData.bath_id && (
                <div className="text-sm sm:text-base text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                  {(() => {
                    // `select` возвращает строку, а `bath_id` в данных обычно число — приводим типы
                    const selectedBath = baths.find(
                      (b) => String(b.bath_id) === String(formData.bath_id)
                    );
                    if (!selectedBath) return null;
                    const baseGuests = Number(selectedBath.base_guests) || 0;
                    const guestsNum = parseInt(formData.guests, 10) || 0;
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
            {validationErrors.guests && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <span>⚠</span> {validationErrors.guests}
              </p>
            )}
          </div>

          {/* Телефон и Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Телефон *</label>
              <input
                type="tel"
                name="client_phone"
                value={formData.client_phone}
                onChange={handleChange}
                placeholder="+7 (999) 123-45-67"
                className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 text-base sm:text-lg ${
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
              <label className="block text-base font-medium text-gray-700 mb-2">Предоплата</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="prepayment"
                value={formData.prepayment}
                onChange={handleChange}
                placeholder="Сумма в рублях"
                className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 text-base sm:text-lg ${
                  validationErrors.prepayment
                    ? 'border-red-500 focus:ring-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {validationErrors.prepayment && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {validationErrors.prepayment}
                </p>
              )}
            </div>
          </div>

          {/* Комментарий */}
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">Комментарий</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              placeholder="Пожелания клиента..."
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-base sm:text-lg"
            />
          </div>

          {/* ========== СЕКЦИЯ ТОВАРОВ ========== */}
          <div className="border-t pt-4 sm:pt-6">
            <h3 className="text-lg sm:text-xl font-medium text-gray-800 mb-3">Товары (опционально)</h3>
            <button
              type="button"
              onClick={() => setIsProductModalOpen(true)}
              className="mb-3 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded text-base sm:text-lg hover:bg-blue-700"
            >
              Добавить товар
            </button>

            {/* Список товаров со скроллом */}
            {formData.selectedProducts.length > 0 && (
              <div className="space-y-3 mb-3">
                {formData.selectedProducts.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="font-medium text-base text-gray-800">{item.name}</div>
                    {item.is_countable !== false ? (
                      <div className="text-sm text-gray-600 mt-1">
                        Доступно: {item.available} {item.unit_name}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 mt-1">
                        Услуга / неисчисляемая позиция — можно указать несколько штук; остаток на складе не ограничивает
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-base text-gray-700">Кол-во:</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            value={item.quantity}
                            onChange={(e) => updateProductQuantity(item.id, e.target.value)}
                            className={`w-16 px-2 py-1 border rounded text-base ${
                              validationErrors[`product_${item.id}`]
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-300'
                            }`}
                          />
                          <span className="text-base text-gray-600">{item.unit_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-base text-gray-700">Цена:</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.price ?? ''}
                            onChange={(e) => updateProductPrice(item.id, e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-base"
                            aria-label={`Цена продажи: ${item.name}`}
                          />
                          <span className="text-base text-gray-600">₽</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-medium">
                          {((parseInt(item.quantity, 10) || 0) * (parseFloat(String(item.price ?? item.purchase_price ?? 0).replace(',', '.')) || 0)).toFixed(2)} ₽
                        </div>
                        {/* Показывать ошибку валидации */}
                        {validationErrors[`product_${item.id}`] && (
                          <p className="text-sm text-red-600 mt-1">{validationErrors[`product_${item.id}`]}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => removeProduct(item.id)}
                          className="text-red-600 text-sm hover:underline mt-1"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>

            <aside className="lg:w-[26rem] xl:w-[30rem] border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50 p-4 sm:p-5 overflow-y-auto min-h-0 flex-shrink-0 max-h-[42vh] lg:max-h-none overscroll-contain">
              <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-4 text-base text-gray-900">
                <header className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
                  <h3 className="text-lg font-bold uppercase tracking-wide">Общий чек</h3>
                  <p className="mt-1 text-sm text-gray-600">Предварительный расчёт</p>
                </header>

                {!receiptSummary.canCalculate ? (
                  <p className="text-gray-500 text-center py-6 text-sm">
                    Выберите баню, дату, время и длительность — чек обновится автоматически
                  </p>
                ) : (
                  <>
                    <section className="space-y-1.5 mb-3">
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-600">Клиент</span>
                        <span className="text-right font-medium">{receiptSummary.clientName}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-600">Телефон</span>
                        <span>{receiptSummary.clientPhone}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-600">Баня</span>
                        <span className="text-right">{receiptSummary.bathName}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-600">Начало</span>
                        <span className="text-right">{receiptSummary.startLabel}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-600">Окончание</span>
                        <span className="text-right">{receiptSummary.endLabel}</span>
                      </div>
                      {receiptSummary.bonusMinutes > 0 && (
                        <div className="flex justify-between gap-3 text-green-700">
                          <span>Бонусное время</span>
                          <span className="text-right">+{receiptSummary.bonusMinutes} мин</span>
                        </div>
                      )}
                    </section>

                    {receiptSummary.appliedPromotion && (
                      <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                        Акция: <strong>{receiptSummary.appliedPromotion.name}</strong>
                      </div>
                    )}

                    <section className="mb-3">
                      <h4 className="font-semibold border-y border-dashed border-gray-400 py-1.5 mb-2 text-base">Позиции</h4>

                      <div className="py-1.5 border-b border-dashed border-gray-300">
                        <div className="font-medium">Услуга бани</div>
                        <div className="text-gray-600 mt-0.5">
                          {receiptSummary.durationHours} ч × {formatReceiptMoney(receiptSummary.hourlyRate)}
                          {receiptSummary.isWeekendRate ? ' (выходной)' : ' (будни)'}
                          {receiptSummary.bonusMinutes > 0 && (
                            <span className="text-green-700"> + {receiptSummary.bonusMinutes} мин в подарок</span>
                          )}
                        </div>
                        <div className="flex justify-between text-gray-700 mt-1">
                          <span>Аренда</span>
                          <span>{formatReceiptMoney(receiptSummary.bathBaseCost)}</span>
                        </div>
                        {receiptSummary.extraGuests > 0 && (
                          <div className="flex justify-between text-gray-700 mt-1">
                            <span>
                              Доп. гости ({receiptSummary.extraGuests} × {formatReceiptMoney(receiptSummary.extraGuestPrice)})
                            </span>
                            <span>{formatReceiptMoney(receiptSummary.extraGuestCost)}</span>
                          </div>
                        )}
                      </div>

                      {receiptSummary.massageItems.map((item, idx) => (
                        <div key={`massage-${idx}`} className="py-1.5 border-b border-dashed border-gray-300">
                          <div className="font-medium">Массаж: {item.name}</div>
                          <div className="flex justify-between text-gray-700">
                            <span>{item.quantity} × {formatReceiptMoney(item.unitPrice)}</span>
                            <span>{formatReceiptMoney(item.lineTotal)}</span>
                          </div>
                        </div>
                      ))}

                      {receiptSummary.productItems.map((item, idx) => (
                        <div key={`product-${idx}`} className="py-1.5 border-b border-dashed border-gray-300">
                          <div className="font-medium">Товар: {item.name}</div>
                          <div className="flex justify-between text-gray-700">
                            <span>{item.quantity} × {formatReceiptMoney(item.unitPrice)}</span>
                            <span>{formatReceiptMoney(item.lineTotal)}</span>
                          </div>
                        </div>
                      ))}

                      {(receiptSummary.giftItems || []).map((item, idx) => (
                        <div key={`gift-${idx}`} className="py-1.5 border-b border-dashed border-green-200">
                          <div className="font-medium text-green-800">Подарок: {item.name}</div>
                          <div className="flex justify-between text-green-700">
                            <span>{item.quantity} × {formatReceiptMoney(0)}</span>
                            <span>0 ₽</span>
                          </div>
                        </div>
                      ))}
                    </section>

                    <footer className="border-t border-dashed border-gray-400 pt-3 space-y-1.5">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>ИТОГО</span>
                        <span className="text-xl">{formatReceiptMoney(receiptSummary.totalCost)}</span>
                      </div>
                      {prepaymentAmount > 0 && (
                        <>
                          <div className="flex justify-between text-amber-700">
                            <span>Предоплата</span>
                            <span>{formatReceiptMoney(prepaymentAmount)}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-gray-800 text-base">
                            <span>К оплате</span>
                            <span>{formatReceiptMoney(Math.max(0, receiptSummary.totalCost - prepaymentAmount))}</span>
                          </div>
                        </>
                      )}
                    </footer>
                  </>
                )}
              </div>
            </aside>
          </div>

        <div
          className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={handleOpenPaymentModal}
                className="flex-1 bg-indigo-600 text-white py-2.5 sm:py-3 px-4 rounded-xl font-medium text-base sm:text-lg hover:bg-indigo-700 transition"
              >
                Оплата
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || isLoadingUnits || !canManageReservation}
              className="flex-1 bg-green-600 text-white py-2.5 sm:py-3 px-4 rounded-xl font-medium text-base sm:text-lg hover:bg-green-700 active:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!canManageReservation
                ? 'Недостаточно прав'
                : (isSubmitting ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Создать бронь')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2.5 sm:py-3 px-4 rounded-xl font-medium text-base sm:text-lg hover:bg-gray-300 transition"
            >
              {isEditing ? 'Закрыть' : 'Отмена'}
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

        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
            <div className={`w-full rounded-2xl bg-white p-5 shadow-2xl ${
              paymentModalView === 'qr' ? 'max-w-md' : 'max-w-sm'
            }`}>
              {paymentModalView === 'choose' ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Выберите способ оплаты</h3>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleCashPayment}
                      className="w-full rounded-xl bg-green-600 text-white py-2.5 px-4 font-medium hover:bg-green-700 transition"
                    >
                      Наличные
                    </button>
                    <button
                      type="button"
                      onClick={handleQrPayment}
                      className="w-full rounded-xl bg-indigo-600 text-white py-2.5 px-4 font-medium hover:bg-indigo-700 transition"
                    >
                      QR-код
                    </button>
                    <button
                      type="button"
                      onClick={handleClosePaymentModal}
                      className="w-full rounded-xl bg-gray-200 text-gray-800 py-2.5 px-4 font-medium hover:bg-gray-300 transition"
                    >
                      Отмена
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Оплата по QR</h3>
                  {receiptSummary.canCalculate && (
                    <p className="text-center text-2xl font-bold text-gray-900 mb-4">
                      {formatReceiptMoney(Math.max(0, receiptSummary.totalCost - prepaymentAmount))}
                    </p>
                  )}
                  {paymentQrImageUrl ? (
                    <div className="flex justify-center mb-4">
                      <img
                        src={paymentQrImageUrl}
                        alt="QR-код для оплаты"
                        className="w-full max-w-[320px] rounded-xl border border-gray-200 shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-center text-sm text-amber-800">
                      QR-код не загружен. Загрузите его в разделе «Настройки».
                    </div>
                  )}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setPaymentModalView('choose')}
                      className="w-full rounded-xl bg-gray-200 text-gray-800 py-2.5 px-4 font-medium hover:bg-gray-300 transition"
                    >
                      Назад
                    </button>
                    <button
                      type="button"
                      onClick={handleClosePaymentModal}
                      className="w-full rounded-xl bg-indigo-600 text-white py-2.5 px-4 font-medium hover:bg-indigo-700 transition"
                    >
                      Закрыть
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    ),
    document.body
  );
}

export default AddBookingModal;