// src/pages/Admin/Reservations/ReservationsFilters.jsx

import { useState, useEffect } from 'react';

function ReservationsFilters({ onApply, onAddBooking }) {
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);

  useEffect(() => {
    onApply({ date });
  }, [date]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    onApply({ date: newDate });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Фильтры</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Выберите дату
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={handleDateChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={onAddBooking}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium transition flex items-center justify-center space-x-2"
          >
            <span>➕</span>
            <span>Добавить бронь</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReservationsFilters;