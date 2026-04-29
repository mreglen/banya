import { useState, useMemo, useCallback } from 'react';
import ReservationsFilters from '../Reservations/ReservationsFilters';
import BookingDetailsModal from '../Reservations/BookingDetailsModal';
import AddBookingModal from '../Reservations/AddBookingModal';
import ReservationsSkeleton from './ReservationsSkeleton';
import { useGetBathsQuery } from '../../../redux/slices/apiSlice';
import { useGetSettingsQuery } from '../../../redux/slices/settingsApiSlice';
import {
  useGetReservationsByDateQuery,
  useDeleteReservationMutation,
} from '../../../redux/slices/reservationSlice';

// ============================================================
// КОНСТАНТЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (вне компонента)
// ============================================================

const STATUS_STYLES = {
  'В ожидании': 'bg-amber-50 text-amber-800 border-amber-200',
  'в работе': 'bg-purple-50 text-purple-800 border-purple-200',
  'закрыт': 'bg-rose-50 text-rose-800 border-rose-200',
  'Подтверждено': 'bg-sky-50 text-sky-800 border-sky-200',
  'Завершено': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Отменено': 'bg-gray-50 text-gray-800 border-gray-200',
};

const formatTime = (date) => {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const formatTimeRange = (start, end) => {
  const options = { hour: '2-digit', minute: '2-digit' };
  const startStr = start.toLocaleTimeString('ru-RU', options);
  const endStr = end.toLocaleTimeString('ru-RU', options);
  return `${startStr} – ${endStr}`;
};

const getStatusStyle = (status) => {
  return STATUS_STYLES[status] || 'bg-gray-100 text-gray-800 border-gray-300';
};

const getTodayDate = () => new Date().toISOString().split('T')[0];

const INITIAL_FILTERS = { date: getTodayDate() };

// Важно: `new Date('YYYY-MM-DD')` парсится как UTC и может уехать от локальной полуночи.
// Поэтому для визуальной сетки и сравнения с датами используем локальную полуночь.
const parseLocalYmd = (ymd) => {
  const [year, month, day] = String(ymd).split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

// ============================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================

function AdminReservationsNew() {
  // 1. Все хуки в начале
  const today = useMemo(() => getTodayDate(), []);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [activeBathId, setActiveBathId] = useState(null);
  const [deleteReservation] = useDeleteReservationMutation();

  const { data: baths = [], isLoading: isLoadingBaths } = useGetBathsQuery();
  const { data: settings } = useGetSettingsQuery();
  
  const {
    data: reservations = [],
    isLoading: isLoadingReservations,
    refetch: refetchReservations
  } = useGetReservationsByDateQuery({
    date: filters.date || today,
  });

  // 2. Вычисляемые значения с useMemo
  const cleaningMinutes = useMemo(() => settings?.cleaning_time_minutes || 30, [settings]);
  const bookingInterval = useMemo(() => settings?.booking_interval_minutes || 30, [settings]);

  const timeSlots = useMemo(() => {
    const slots = [];
    const interval = bookingInterval;
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const slotStart = parseLocalYmd(filters.date);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotStart.getTime() + interval * 60000);
        
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        slots.push({
          time: timeStr,
          start: slotStart,
          end: slotEnd,
        });
      }
    }
    return slots;
  }, [filters.date, bookingInterval]);

  const bathsToDisplay = useMemo(() => {
    if (!Array.isArray(baths) || baths.length === 0) {
      return [];
    }

    return baths.map(bath => {
      const bathId = bath.bath_id !== undefined ? bath.bath_id : bath.id;
      if (bathId === undefined) {
        console.warn('У бани отсутствует и bath_id, и id:', bath);
        return null;
      }

      const realBookings = (Array.isArray(reservations) ? reservations : []).filter(res => {
        if (!res || !res.bath_id || !res.start_datetime) return false;
        // Проверяем пересечение с выбранным днем
        const bookingStart = new Date(res.start_datetime);
        const bookingEnd = new Date(res.end_datetime);
        const filterDateStart = parseLocalYmd(filters.date);
        const filterDateEnd = new Date(filterDateStart);
        filterDateEnd.setDate(filterDateEnd.getDate() + 1);
        
        // Бронь пересекается с выбранным днем
        return res.bath_id === bathId && 
               bookingStart < filterDateEnd && 
               bookingEnd > filterDateStart;
      });

      // Сортируем бронирования по времени начала
      realBookings.sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));

      const bookingsWithCleaning = [];
      realBookings.forEach(booking => {
        bookingsWithCleaning.push(booking);

        const endDateTime = new Date(booking.end_datetime);
        const cleaningStart = new Date(endDateTime);
        const cleaningEnd = new Date(endDateTime.getTime() + cleaningMinutes * 60000);

        // Показываем уборку если она начинается в выбранный день
        const cleaningDate = cleaningStart.toLocaleDateString('en-CA');
        
        if (cleaningDate === filters.date) {
          bookingsWithCleaning.push({
            ...booking,
            reservation_id: `cleaning-${booking.reservation_id}`,
            is_cleaning: true,
            start_datetime: cleaningStart.toISOString(),
            end_datetime: cleaningEnd.toISOString(),
            client_name: 'Уборка',
            total_cost: null,
            status: 'Уборка',
          });
        }
      });

      return {
        bath_id: bathId,
        bathName: bath.name || 'Без названия',
        bookings: bookingsWithCleaning,
        hasBookings: bookingsWithCleaning.length > 0,
      };
    }).filter(Boolean);
  }, [baths, reservations, filters.date, cleaningMinutes]);

  const filteredBaths = useMemo(() => {
    if (!activeBathId) return bathsToDisplay;
    return bathsToDisplay.filter(bath => bath.bath_id === activeBathId);
  }, [bathsToDisplay, activeBathId]);

  // 3. Обработчики с useCallback
  const handleDeleteBooking = useCallback(async (id) => {
    try {
      await deleteReservation(id).unwrap();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  }, [deleteReservation]);

  const handleApply = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleViewBooking = useCallback((booking) => {
    setSelectedBooking(booking);
  }, []);

  const handleAddBooking = useCallback(() => {
    setIsAddModalOpen(true);
    setEditingBooking(null);
  }, []);

  const handleEditBooking = useCallback((booking) => {
    setEditingBooking(booking);
    setSelectedBooking(null);
  }, []);

  const handleCloseAllModals = useCallback(() => {
    setSelectedBooking(null);
    setEditingBooking(null);
    setIsAddModalOpen(false);
    refetchReservations();
  }, [refetchReservations]);

  const handleSetActiveBath = useCallback((bathId) => {
    setActiveBathId(bathId);
  }, []);

  // 4. Проверка загрузки
  if (isLoadingBaths || isLoadingReservations) {
    return <ReservationsSkeleton />;
  }

  // 5. Рендер
  const formattedDate = new Date(filters.date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className="px-0 py-2 md:p-4 overflow-x-hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 md:mb-6">
        Записи на {formattedDate}
      </h2>

      <ReservationsFilters
        onApply={handleApply}
        onAddBooking={handleAddBooking}
      />

      {/* Desktop View */}
      <div className="hidden md:block">
        {/* Табы для переключения между банями */}
        {bathsToDisplay.length > 1 && (
          <div className="flex space-x-1 mb-6 border-b border-gray-200">
            <button
              onClick={() => handleSetActiveBath(null)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                !activeBathId 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Все бани
            </button>
            {bathsToDisplay.map(bath => (
              <button
                key={bath.bath_id}
                onClick={() => handleSetActiveBath(bath.bath_id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeBathId === bath.bath_id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {bath.bathName}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="inline-flex space-x-6 min-h-[600px]">
            {/* Time column */}
            <div className="flex-shrink-0 w-32 bg-gray-50 border-r border-gray-200 sticky top-0">
              <div className="text-sm font-medium text-gray-700 px-4 py-3 border-b border-gray-200">ВРЕМЯ</div>
              {timeSlots.map((slot, idx) => (
                <div key={idx} className="text-sm text-gray-600 flex items-center justify-center" style={{ height: '56px' }}>
                  {formatTimeRange(slot.start, slot.end)}
                </div>
              ))}
            </div>

            {filteredBaths.length === 0 ? (
              <div className="text-gray-500 p-8">Нет доступных бань</div>
            ) : (
              filteredBaths.map((bath) => (
                <div key={bath.bath_id} className="flex-shrink-0 w-96">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-white">
                      <h3 className="text-base font-semibold text-gray-900">
                        {bath.bathName}
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full table-fixed border-separate border-spacing-0">
                       
                        <tbody>
                          {timeSlots.map((slot, idx) => {
                            // Находим бронирования, которые пересекаются с этим слотом
                            const overlappingItems = bath.bookings.filter(item => {
                              const start = new Date(item.start_datetime);
                              const end = new Date(item.end_datetime);
                              
                              // Ограничиваем бронирование пределами текущего дня
                              const dayStart = parseLocalYmd(filters.date);
                              const dayEnd = new Date(dayStart);
                              dayEnd.setDate(dayEnd.getDate() + 1);
                              
                              const effectiveStart = start < dayStart ? dayStart : start;
                              const effectiveEnd = end > dayEnd ? dayEnd : end;
                              
                              // Проверяем пересечение с слотом
                              const overlaps = effectiveStart < slot.end && effectiveEnd > slot.start;
                              
                              return overlaps;
                            });

                            // Если нет бронирований - показываем "Свободно"
                            if (overlappingItems.length === 0) {
                              return (
                                <tr key={idx} className="hover:bg-gray-25 transition-colors">
                                  <td className="px-6 py-0 relative bg-gray-50" style={{ height: '56px', overflow: 'visible' }}>
                                    <div className="absolute inset-0 flex items-center justify-center text-emerald-600 text-xs font-medium bg-emerald-50 rounded border border-emerald-100">
                                      Свободно
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            // Сортируем по времени начала
                            overlappingItems.sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));

                            // Берем первое бронирование для отображения
                            const activeItem = overlappingItems[0];
                            const itemStart = new Date(activeItem.start_datetime);
                            const itemEnd = new Date(activeItem.end_datetime);
                            
                            // Ограничиваем бронирование пределами текущего дня
                            const dayStart = parseLocalYmd(filters.date);
                            const dayEnd = new Date(dayStart);
                            dayEnd.setDate(dayEnd.getDate() + 1);
                            
                            const effectiveStart = itemStart < dayStart ? dayStart : itemStart;
                            const effectiveEnd = itemEnd > dayEnd ? dayEnd : itemEnd;
                            
                            // Проверяем, это первый слот, где начинается бронь
                            const isFirstSlotOfBooking = 
                              effectiveStart >= slot.start && 
                              effectiveStart < slot.end;

                            if (!isFirstSlotOfBooking) {
                              // Проверяем, продолжается ли бронь через этот слот
                              const bookingContinuesThroughSlot = 
                                effectiveStart < slot.start && 
                                effectiveEnd > slot.start;
                              
                              if (bookingContinuesThroughSlot) {
                                // Бронь продолжается через этот слот - не показываем ничего
                                return (
                                  <tr key={idx} className="hover:bg-gray-25 transition-colors">
                                    <td className="px-6 py-0 relative bg-gray-50" style={{ height: '56px', overflow: 'hidden' }}>
                                    </td>
                                  </tr>
                                );
                              }
                              
                              // Бронь не начинается и не продолжается - показываем "Свободно"
                              return (
                                <tr key={idx} className="hover:bg-gray-25 transition-colors">
                                  <td className="px-6 py-0 relative bg-gray-50" style={{ height: '56px', overflow: 'visible' }}>
                                    <div className="absolute inset-0 flex items-center justify-center text-emerald-600 text-xs font-medium bg-emerald-50 rounded border border-emerald-100">
                                      Свободно
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                            
                            // Бронирование начинается в этом слоте - рассчитываем позицию и высоту
                            const minutesFromSlotStart = (effectiveStart - slot.start) / 60000;
                              
                            const durationMinutes = (effectiveEnd - effectiveStart) / 60000;
                            const slotMinutes = (slot.end - slot.start) / 60000;
                            
                            const topPercent = (minutesFromSlotStart / slotMinutes) * 100;
                            // Высота может быть больше 100% - бронирование растягивается на множество слотов
                            const heightPercent = (durationMinutes / slotMinutes) * 100;

                            // Tooltip с полным временем
                            const tooltipText = activeItem.is_cleaning 
                              ? 'Уборка' 
                              : `${activeItem.client_name} • ${formatTime(itemStart < dayStart ? dayStart : itemStart)} – ${formatTime(itemEnd)}`;

                            return (
                              <tr key={idx} className="hover:bg-gray-25 transition-colors">
                                <td className="px-6 py-0 relative bg-gray-50" style={{ height: '56px', overflow: 'visible' }}>
                                  <div
                                    className={`absolute inset-x-0 rounded-lg px-2 py-1 cursor-pointer hover:shadow transition-all duration-200 group border-2 ${getStatusStyle(activeItem.is_cleaning ? 'Уборка' : activeItem.status)}`}
                                    style={{
                                      top: `${topPercent}%`,
                                      height: `${heightPercent}%`,
                                      zIndex: 10,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      textAlign: 'center',
                                      gap: '2px',
                                    }}
                                    title={tooltipText}
                                    onClick={() => !activeItem.is_cleaning && handleViewBooking(activeItem)}
                                  >
                                    <div className={`w-1 rounded-full absolute left-0 top-1 bottom-1 group-hover:w-2 transition-all duration-200 ${
                                      activeItem.is_cleaning
                                        ? 'bg-orange-500'
                                        : activeItem.status === 'в ожидании'
                                          ? 'bg-amber-500'
                                          : activeItem.status === 'в работе'
                                            ? 'bg-purple-500'
                                            : activeItem.status === 'закрыт'
                                              ? 'bg-rose-500'
                                              : activeItem.status === 'Подтверждено'
                                                ? 'bg-sky-500'
                                                : 'bg-gray-400'
                                    }`}></div>
                                    {activeItem.is_cleaning ? (
                                      <div className="font-medium text-xs">Уборка</div>
                                    ) : (
                                      <>
                                        <div className="font-medium truncate w-full text-xs">{activeItem.client_name || '—'}</div>
                                        <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                                          activeItem.status === 'в ожидании' ? 'bg-amber-100 text-amber-800' :
                                          activeItem.status === 'в работе' ? 'bg-purple-100 text-purple-800' :
                                          activeItem.status === 'закрыт' ? 'bg-rose-100 text-rose-800' :
                                          activeItem.status === 'Подтверждено' ? 'bg-sky-100 text-sky-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {activeItem.status || '—'}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {/* Табы для переключения между банями */}
        {bathsToDisplay.length > 1 && (
          <div className="flex space-x-1 mb-3 border-b border-gray-200 overflow-x-auto pb-1">
            <button
              onClick={() => handleSetActiveBath(null)}
              className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                !activeBathId 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              Все бани
            </button>
            {bathsToDisplay.map(bath => (
              <button
                key={bath.bath_id}
                onClick={() => handleSetActiveBath(bath.bath_id)}
                className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                  activeBathId === bath.bath_id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500'
                }`}
              >
                {bath.bathName}
              </button>
            ))}
          </div>
        )}

        {filteredBaths.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Нет доступных бань</div>
        ) : (
          filteredBaths.map((bath) => (
            <div key={bath.bath_id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mx-0.5">
              <div className="px-4 py-3 border-b border-gray-200 bg-white">
                <h3 className="text-base font-semibold text-gray-900">
                  {bath.bathName}
                </h3>
              </div>
              <div className="p-2.5 space-y-2.5">
                {bath.bookings.length === 0 ? (
                  <p className="text-green-600 font-medium">Свободно весь день</p>
                ) : (
                  [...bath.bookings]
                    .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))
                    .map((booking) => (
                      <div
                        key={booking.reservation_id}
                        className={`p-2.5 rounded-lg border ${
                          booking.is_cleaning
                            ? 'bg-indigo-50 border-indigo-200'
                            : 'bg-gray-50 border-gray-200'
                          }`}
                      >
                        {booking.is_cleaning ? (
                          <div>
                            <div className="font-semibold text-orange-800">Уборка</div>
                            <div className="text-sm text-orange-600">
                              {new Date(booking.start_datetime) < parseLocalYmd(filters.date)
                                ? parseLocalYmd(filters.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                                : new Date(booking.start_datetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                              }
                              &nbsp;–&nbsp;
                              {new Date(booking.end_datetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold text-gray-900 mb-1">
                              {booking.client_name || '—'}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              {booking.client_phone || '—'}
                            </div>
                            {booking.notes && (
                              <div
                                className="text-sm text-gray-600 mb-1"
                                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                              >
                                {booking.notes}
                              </div>
                            )}
                            <div className="text-sm font-medium text-gray-800 mb-1">
                              {new Date(booking.start_datetime) < parseLocalYmd(filters.date)
                                ? parseLocalYmd(filters.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                                : new Date(booking.start_datetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                              }
                              &nbsp;–&nbsp;
                              {new Date(booking.end_datetime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-base font-semibold text-gray-900 mb-2">
                              {booking.total_cost} ₽
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className={`px-2.5 py-1 text-xs rounded font-medium ${
                                booking.status === 'в ожидании' ? 'bg-amber-100 text-amber-800' :
                                booking.status === 'в работе' ? 'bg-purple-100 text-purple-800' :
                                booking.status === 'закрыт' ? 'bg-rose-100 text-rose-800' :
                                booking.status === 'Подтверждено' ? 'bg-sky-100 text-sky-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {booking.status || '—'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1.5 mt-2.5">
                              <button
                                onClick={() => handleViewBooking(booking)}
                                className="w-full bg-blue-100 text-blue-800 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-200 transition min-h-[40px]"
                              >
                                Просмотр
                              </button>
                              <button
                                onClick={() => handleEditBooking(booking)}
                                className="w-full bg-green-100 text-green-800 py-2.5 rounded-lg text-sm font-medium hover:bg-green-200 transition min-h-[40px]"
                              >
                                Редактировать
                              </button>
                              <button
                                onClick={() => handleDeleteBooking(booking.reservation_id)}
                                className="w-full bg-red-100 text-red-800 py-2.5 rounded-lg text-sm font-medium hover:bg-red-200 transition min-h-[40px]"
                              >
                                Удалить
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <BookingDetailsModal
        booking={selectedBooking}
        onClose={handleCloseAllModals}
        onEdit={handleEditBooking}
        onDelete={handleDeleteBooking}
      />

      <AddBookingModal
        isOpen={isAddModalOpen || editingBooking !== null}
        onClose={handleCloseAllModals}
        booking={editingBooking}
        selectedDate={filters.date}
      />
    </div>
  );  
}

export default AdminReservationsNew;
