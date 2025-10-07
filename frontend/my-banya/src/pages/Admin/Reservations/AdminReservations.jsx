import { useState, useMemo } from 'react';
import ReservationsFilters from '../Reservations/ReservationsFilters';
import BookingDetailsModal from '../Reservations/BookingDetailsModal';
import AddBookingModal from '../Reservations/AddBookingModal';
import { useGetBathsQuery, useGetReservationsByDateQuery, useDeleteReservationMutation, } from '../../../redux/slices/apiSlice';

function AdminReservations() {
  const today = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState({ date: today });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [deleteReservation] = useDeleteReservationMutation();
  // Получаем ВСЕ бани
  const { data: baths = [], isLoading: isLoadingBaths } = useGetBathsQuery();
  // Получаем брони на выбранную дату
  const { data: reservations = [], isLoading: isLoadingReservations } = useGetReservationsByDateQuery({
    date: filters.date || today,
  });

  // Простая генерация слотов 9:00 - 23:30
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 9; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const dateTime = new Date(`${filters.date}T${timeStr}:00`);
        slots.push({
          time: timeStr,
          start: dateTime,
          end: new Date(dateTime.getTime() + 30 * 60000),
        });
      }
    }
    return slots;
  }, [filters.date]);

  // Формируем список бань с бронями
  const bathsToDisplay = useMemo(() => {
    if (!Array.isArray(baths) || baths.length === 0) {
      return [];
    }

    return baths.map(bath => {
      const bathId = bath.bath_id !== undefined ? bath.bath_id : bath.id;
      if (bathId === undefined) {
        console.warn('⚠️ У бани отсутствует и bath_id, и id:', bath);
        return null;
      }

      // Получаем реальные брони
      const realBookings = (Array.isArray(reservations) ? reservations : []).filter(res => {
        if (!res || !res.bath_id || !res.start_datetime) return false;
        const bookingDate = res.start_datetime.split('T')[0];
        return res.bath_id === bathId && bookingDate === filters.date;
      });

      // Добавляем "уборку" после каждой брони
      const bookingsWithCleaning = [];
      realBookings.forEach(booking => {
        bookingsWithCleaning.push(booking);

        const endDateTime = new Date(booking.end_datetime);
        const cleaningStart = new Date(endDateTime);
        const cleaningEnd = new Date(endDateTime.getTime() + 30 * 60000); // +30 минут

        const cleaningDate = cleaningStart.toISOString().split('T')[0];
        if (cleaningDate === filters.date) {
          bookingsWithCleaning.push({
            ...booking,
            reservation_id: `cleaning-${booking.reservation_id}`,
            is_cleaning: true,
            start_datetime: cleaningStart.toISOString(),
            end_datetime: cleaningEnd.toISOString(),
            client_name: 'Уборка',
            total_cost: null,
            status: 'уборка',
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
  }, [baths, reservations, filters.date]);

  // Формат времени
  const formatTime = (date) => {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  // Формат интервала времени: "09:00 – 09:30"
  const formatTimeRange = (start, end) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    const startStr = start.toLocaleTimeString('ru-RU', options);
    const endStr = end.toLocaleTimeString('ru-RU', options);
    return `${startStr} – ${endStr}`;
  };

  // Обработчики
  const handleDeleteBooking = async (id) => {
    try {
      await deleteReservation(id).unwrap();
      alert('✅ Бронь успешно удалена!');
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('❌ Не удалось удалить бронь');
    }
  };

  const handleApply = (newFilters) => {
    setFilters(newFilters);
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
  };

  const handleCloseModal = () => {
    setSelectedBooking(null);
  };

  const handleAddBooking = () => {
    setIsAddModalOpen(true); // Открываем модалку для добавления
    setEditingBooking(null); // Убеждаемся, что нет данных редактирования
  };


  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setSelectedBooking(null); // закрываем просмотр
  };

  const handleCloseAllModals = () => {
    setSelectedBooking(null);
    setEditingBooking(null);
    setIsAddModalOpen(false);
  };
  // Загрузка
  if (isLoadingBaths || isLoadingReservations) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Записи на {new Date(filters.date).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </h2>

      <ReservationsFilters
        onApply={handleApply}
        onAddBooking={handleAddBooking}
      />

      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="inline-flex space-x-6 min-h-[600px]">
          {/* Колонка времени */}
          <div className="flex-shrink-0 w-32 bg-gray-50 p-4 border-r border-gray-200 sticky top-0">
            <div className="text-sm font-medium text-gray-700 mb-2">ВРЕМЯ</div>
            {/* Пустая строка для выравнивания с таблицами */}
            <div className="h-14"></div>
            {timeSlots.map((slot, idx) => (
              <div key={idx} className="text-sm text-gray-600 h-14 flex items-center justify-center leading-none">
                {formatTimeRange(slot.start, slot.end)}
              </div>
            ))}
          </div>

          {/* Колонки с банями */}
          {bathsToDisplay.length === 0 ? (
            <div className="text-gray-500 p-8">Нет доступных бань</div>
          ) : (
            bathsToDisplay.map((bath) => (
              <div key={bath.bath_id} className="flex-shrink-0 w-96">
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-800">{bath.bathName}</h3>
                  </div>

                  {/* Таблица временных слотов */}
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed border-separate border-spacing-0">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Статус
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {timeSlots.map((slot, idx) => {
                          // Находим все записи (включая уборку), которые пересекаются со слотом
                          const overlappingItems = bath.bookings.filter(item => {
                            const start = new Date(item.start_datetime);
                            const end = new Date(item.end_datetime);
                            const startUTC = new Date(start.toISOString().replace('+05:00', 'Z'));
                            const endUTC = new Date(end.toISOString().replace('+05:00', 'Z'));
                            return startUTC < slot.end && endUTC > slot.start;
                          });

                          const activeItem = overlappingItems[0];

                          // Определяем, начинается ли здесь запись
                          const itemStartsHere = bath.bookings.find(item => {
                            const start = new Date(item.start_datetime);
                            const startUTC = new Date(start.toISOString().replace('+05:00', 'Z'));
                            return startUTC >= slot.start && startUTC < slot.end;
                          });

                          const durationMinutes = itemStartsHere
                            ? (new Date(itemStartsHere.end_datetime) - new Date(itemStartsHere.start_datetime)) / 60000
                            : 0;
                          const heightPercent = (durationMinutes / 30) * 100;

                          // Стили в зависимости от типа
                          const isCleaning = itemStartsHere?.is_cleaning;
                          const bgColor = isCleaning ? 'bg-blue-100 border-blue-300' : 'bg-red-50 border-red-400';
                          const textColor = isCleaning ? 'text-blue-800' : 'text-red-800';

                          return (
                            <tr key={idx} className="hover:bg-gray-25 transition-colors">
                              <td className="px-6 py-0 relative bg-gray-50" style={{ height: '56px', overflow: 'visible' }}>
                                {overlappingItems.length > 0 && activeItem && itemStartsHere ? (
                                  <div
                                    className={`absolute inset-x-0 ${bgColor} ${textColor} text-sm font-medium rounded-lg px-2 py-1 cursor-pointer hover:shadow transition-all duration-200 group`}
                                    style={{
                                      top: 0,
                                      height: `${heightPercent}%`,
                                      zIndex: 10,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      textAlign: 'center',
                                      gap: '2px',
                                    }}
                                    title={isCleaning ? 'Уборка' : `${activeItem.client_name} • ${formatTime(new Date(activeItem.start_datetime))} – ${formatTime(new Date(activeItem.end_datetime))}`}
                                    onClick={() => !isCleaning && handleViewBooking(activeItem)}
                                  >
                                    <div className={`w-1 rounded-full absolute left-0 top-1 bottom-1 group-hover:w-2 transition-all duration-200 ${isCleaning ? 'bg-blue-400' : 'bg-red-400'}`}></div>
                                    {isCleaning ? (
                                      <div className="font-medium">Уборка</div>
                                    ) : (
                                      <>
                                        <div className="font-medium truncate w-full">Клиент: {activeItem.client_name || '—'}</div>
                                        <div className="truncate w-full">Телефон: {activeItem.client_phone || '—'}</div>
                                        <div className="truncate w-full">Комментарий: {activeItem.notes || '—'}</div>
                                        <div className="font-semibold w-full">Итого: {activeItem.total_cost} ₽</div>
                                        <div className="font-medium truncate w-full">Статус: {activeItem.status}</div>
                                      </>
                                    )}
                                  </div>
                                ) : overlappingItems.length === 0 ? (
                                  <div className="absolute inset-0 flex items-center justify-center text-green-600 text-sm font-medium bg-green-50 rounded-lg border border-green-200">
                                    Свободно
                                  </div>
                                ) : null}
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
      {/* Модалка для ПРОСМОТРА брони */}
      <BookingDetailsModal
        booking={selectedBooking}
        onClose={handleCloseAllModals}
        onEdit={handleEditBooking}
        onDelete={handleDeleteBooking}
      />

      {/* Модалка для ДОБАВЛЕНИЯ или РЕДАКТИРОВАНИЯ */}
      <AddBookingModal
        isOpen={isAddModalOpen || editingBooking !== null}
        onClose={handleCloseAllModals}
        booking={editingBooking} // если null — режим создания
        selectedDate={filters.date}
      />
    </div>
  );
}

export default AdminReservations;