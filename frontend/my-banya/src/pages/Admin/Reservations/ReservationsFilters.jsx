// src/pages/Admin/Reservations/ReservationsFilters.jsx

import { useState, useEffect } from 'react';

const formatLocalYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function ReservationsFilters({ onApply, onAddBooking }) {
  const today = formatLocalYmd(new Date());

  const [date, setDate] = useState(today);

  useEffect(() => {
    onApply({ date });
  }, [date, onApply]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    onApply({ date: newDate });
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border border-gray-200 mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Фильтры</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 items-end">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Выберите дату
          </label>
          <input
            type="date"
            id="date"
            value={date}
            readOnly
            onKeyDown={(e) => e.preventDefault()}
            onClick={(e) => e.currentTarget.showPicker?.()}
            onFocus={(e) => e.currentTarget.showPicker?.()}
            onChange={handleDateChange}
            className="w-full py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm cursor-pointer"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={onAddBooking}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 sm:py-3 px-4 rounded-xl font-medium transition flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Добавить бронь</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReservationsFilters;