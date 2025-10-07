// src/pages/Booking/Booking.jsx

import { useState } from 'react';
import { useCreateBookingMutation } from '../../redux/slices/apiSlice';

function Booking() {
  const [createBooking, { isLoading, isSuccess, isError, error }] = useCreateBookingMutation();

  const [formData, setFormData] = useState({
    date: '',
    duration_hours: 1,
    bath_id: '',
    guests: 1,
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const MAX_NOTES_LENGTH = 300;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Ограничение для поля notes
    if (name === 'notes' && value.length > MAX_NOTES_LENGTH) {
      return; // Не обновляем состояние, если превышен лимит
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = 'Укажите дату';
    if (!formData.bath_id) newErrors.bath_id = 'Выберите баню';
    if (!formData.guests || formData.guests < 1) newErrors.guests = 'Укажите количество гостей';
    if (!formData.name?.trim()) newErrors.name = 'Введите имя';
    if (!formData.phone?.trim()) newErrors.phone = 'Введите телефон';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createBooking(formData).unwrap();
      setShowSuccess(true);
      setFormData({
        date: '',
        duration_hours: 1,
        bath_id: '',
        guests: 1,
        name: '',
        phone: '',
        email: '',
        notes: '',
      });
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Ошибка отправки заявки:', err);
    }
  };

  const remainingChars = MAX_NOTES_LENGTH - formData.notes.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50 py-12 px-4 sm:px-6 lg:px-8 mt-14">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-5">
          <h1 className="text-4xl sm:text-5xl font-light text-gray-800 mb-4">Забронировать баню</h1>
          <p className="text-lg text-gray-600 font-extralight max-w-2xl mx-auto">
            Выберите удобную дату и время — мы подготовим парную к вашему приходу.
            Уют, чистота и ароматные веники уже ждут вас!
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Сообщение об успехе */}
            {showSuccess && (
              <div className="text-center text-green-600 font-medium bg-green-50 py-3 rounded-xl">
                ✅ Заявка успешно отправлена! Мы свяжемся с вами.
              </div>
            )}

            {/* Сообщение об ошибке */}
            {isError && !showSuccess && (
              <div className="text-center text-red-600 font-medium bg-red-50 py-3 rounded-xl">
                ❌ Ошибка: {error?.data?.detail || 'Не удалось отправить заявку'}
              </div>
            )}

            {/* Дата и часы */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Дата посещения
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 ${
                    errors.date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
              </div>
              <div>
                <label htmlFor="duration_hours" className="block text-sm font-medium text-gray-700 mb-2">
                  Продолжительность (в часах)
                </label>
                <input
                  type="number"
                  id="duration_hours"
                  name="duration_hours"
                  min="1"
                  max="12"
                  value={formData.duration_hours}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Выбор бани */}
            <div>
              <label htmlFor="bath_id" className="block text-sm font-medium text-gray-700 mb-2">
                Выберите баню
              </label>
              <select
                id="bath_id"
                name="bath_id"
                value={formData.bath_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl bg-white ${
                  errors.bath_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Выберите баню</option>
                <option value="1">Кедровая баня</option>
                <option value="2">Нефритовая баня</option>
                <option value="3">Липовая баня</option>
              </select>
              {errors.bath_id && <p className="text-red-500 text-sm mt-1">{errors.bath_id}</p>}
            </div>

            {/* Гости */}
            <div>
              <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-2">
                Количество гостей
              </label>
              <input
                type="number"
                id="guests"
                name="guests"
                min="1"
                max="12"
                value={formData.guests}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 ${
                  errors.guests ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.guests && <p className="text-red-500 text-sm mt-1">{errors.guests}</p>}
            </div>

            {/* Имя и телефон */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Ваше имя
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Иван"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+7 (999) 123-45-67"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email (опционально)
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ivan@example.com"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Дополнительно */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Дополнительно (макс. {MAX_NOTES_LENGTH} символов)
              </label>
              <div className="relative">
                <textarea
                  id="notes"
                  name="notes"
                  rows="3"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Веники, шашлык, аренда посуды..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 resize-none"
                  maxLength={MAX_NOTES_LENGTH}
                />
                <div className={`absolute bottom-2 right-3 text-xs ${
                  remainingChars < 50 ? 'text-red-500 font-medium' : 'text-gray-500'
                }`}>
                  {remainingChars} / {MAX_NOTES_LENGTH}
                </div>
              </div>
            </div>

            {/* Кнопка */}
            <div className="pt-4 text-center">
              <button
                type="submit"
                disabled={isLoading}
                className={`px-10 py-3 rounded-xl text-lg font-medium transition-all duration-300 ${
                  isLoading
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-xl'
                }`}
              >
                {isLoading ? 'Отправка...' : 'Забронировать'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Booking;