import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import {
  useGetBathsQuery,
  useCreateReservationMutation,
  useGetBroomsQuery,
  useGetMassagesQuery,
  useGetMenuCategoriesQuery,
  useGetAllMenuItemsQuery,
  useUpdateReservationMutation,
  useGetReservationStatusesQuery,
} from '../../../redux/slices/apiSlice';

// Генерация временных слотов: 09:00, 09:30, ..., 23:30
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
    brooms: [],
    menu_items: [],
    massages: [],
  });

  // Загрузка данных
  const { data: baths = [], isLoading: isLoadingBaths } = useGetBathsQuery();
  const { data: brooms = [], isLoading: isLoadingBrooms } = useGetBroomsQuery();
  const { data: massages = [], isLoading: isLoadingMassages } = useGetMassagesQuery();
  const { data: categories = [], isLoading: isLoadingCategories } = useGetMenuCategoriesQuery();
  const { data: allMenuItems = [], isLoading: isLoadingMenuItems } = useGetAllMenuItemsQuery();
  const { data: statusOptions = [], isLoading: isLoadingStatuses } = useGetReservationStatusesQuery();

  // Состояния для UI
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [kitchenItems, setKitchenItems] = useState([]);
  const [showBrooms, setShowBrooms] = useState(false);
  const [showMassages, setShowMassages] = useState(false);
  const [showKitchen, setShowKitchen] = useState(false);

  // Синхронизация даты при создании
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

  // Заполнение формы при редактировании
  // 🧩 Заполняем форму при редактировании
  useEffect(() => {
    if (booking && brooms.length > 0 && massages.length > 0 && allMenuItems.length > 0) {
      const start = new Date(booking.start_datetime);
      const end = new Date(booking.end_datetime);

      const date = start.toISOString().split('T')[0]; // YYYY-MM-DD
      const start_time = start.toTimeString().slice(0, 5); // HH:mm
      const end_time = end.toTimeString().slice(0, 5);

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
        status_id: booking.status_id || 1,
        brooms: (booking.brooms || []).map(b => ({
          broom_id: b.broom_id,
          quantity: b.quantity,
        })),
        menu_items: (booking.menu_items || []).map(m => ({
          menu_item_id: m.menu_item_id,
          quantity: m.quantity,
        })),
        massages: (booking.massages || []).map(m => ({
          massage_id: m.massage_id,
          quantity: m.quantity,
        })),
      });

      // Устанавливаем категории для кухни
      if (booking.menu_items?.length > 0) {
        const itemCategories = booking.menu_items
          .map(item => {
            const menuItem = allMenuItems.find(m => m.id === item.menu_item_id);
            return menuItem ? menuItem.category : null;
          })
          .filter(Boolean);

        const uniqueCategories = [...new Set(itemCategories)];
        setSelectedCategories(uniqueCategories);
      }
    }
  }, [booking, brooms, massages, allMenuItems]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      status_id: parseInt(e.target.value, 10),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const start_datetime = `${formData.date}T${formData.start_time}`;
    const end_datetime = `${formData.date}T${formData.end_time}`;

    if (!formData.bath_id || !formData.client_name) {
      alert('Заполните обязательные поля: баня, имя клиента');
      return;
    }

    if (new Date(start_datetime) >= new Date(end_datetime)) {
      alert('Время окончания должно быть позже начала');
      return;
    }

    const payload = {
      ...formData,
      start_datetime,
      end_datetime,
    };

    try {
      if (isEditing) {
        await updateReservation({
          id: booking.reservation_id,
          ...payload,
        }).unwrap();
        alert('Бронь успешно обновлена!');
      } else {
        await createReservation(payload).unwrap();
        alert('Бронь успешно создана!');
      }
      onClose();
    } catch (error) {
      console.error('Ошибка:', error);
      let message = isEditing ? 'Не удалось обновить бронь' : 'Не удалось создать бронь';
      if (error.data?.detail) {
        message = error.data.detail;
      }
      alert('❌ ' + message);
    }
  };

  // Управление вениками, массажами, блюдами — без изменений
  const handleBroomChange = (broomId, quantity) => {
    setFormData((prev) => {
      const existing = prev.brooms.find((b) => b.broom_id === broomId);
      let updated = [...prev.brooms];
      if (quantity <= 0) {
        updated = updated.filter((b) => b.broom_id !== broomId);
      } else {
        if (existing) {
          updated = updated.map((b) => (b.broom_id === broomId ? { ...b, quantity } : b));
        } else {
          updated.push({ broom_id: broomId, quantity });
        }
      }
      return { ...prev, brooms: updated };
    });
  };

  const handleMassageChange = (massageId, quantity) => {
    setFormData((prev) => {
      const currentList = prev.massages || [];
      const existing = currentList.find((m) => m.massage_id === massageId);
      let updated = [...currentList];
      if (quantity <= 0) {
        updated = updated.filter((m) => m.massage_id !== massageId);
      } else {
        if (existing) {
          updated = updated.map((m) => (m.massage_id === massageId ? { ...m, quantity } : m));
        } else {
          updated.push({ massage_id: massageId, quantity });
        }
      }
      return { ...prev, massages: updated };
    });
  };

  const handleMenuItemChange = (itemId, quantity) => {
    setFormData((prev) => {
      const existing = prev.menu_items.find((m) => m.menu_item_id === itemId);
      let updated = [...prev.menu_items];
      if (quantity <= 0) {
        updated = updated.filter((m) => m.menu_item_id !== itemId);
      } else {
        if (existing) {
          updated = updated.map((m) => (m.menu_item_id === itemId ? { ...m, quantity } : m));
        } else {
          updated.push({ menu_item_id: itemId, quantity });
        }
      }
      return { ...prev, menu_items: updated };
    });
  };

  useEffect(() => {
    if (selectedCategories.length > 0 && allMenuItems.length > 0) {
      const filtered = allMenuItems.filter((item) => selectedCategories.includes(item.category));
      setKitchenItems(filtered);
    } else {
      setKitchenItems([]);
    }
  }, [selectedCategories, allMenuItems]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditing ? 'Редактировать бронь' : 'Добавить бронь'}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Статус — только при редактировании */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
              {isLoadingStatuses ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100">
                  Загрузка статусов...
                </div>
              ) : (
                <select
                  value={formData.status_id}
                  onChange={handleStatusChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  disabled={isLoadingStatuses}
                >
                  {statusOptions.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.status_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Баня */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Баня *</label>
            {isLoadingBaths ? (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100">Загрузка...</div>
            ) : (
              <select
                name="bath_id"
                value={formData.bath_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Дата */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Дата *</label>
              <input
                type="date"
                value={formData.date}
                disabled={!isEditing} // при создании — только чтение
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Начало */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Начало *</label>
              <select
                value={formData.start_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              >
                {generateTimeOptions().map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            {/* Окончание */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Окончание *</label>
              <select
                value={formData.end_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              >
                {generateTimeOptions().map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Клиент */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Имя клиента *</label>
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              placeholder="Иван Иванов"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Гости */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Количество гостей *</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                name="guests"
                min="1"
                value={formData.guests}
                onChange={handleChange}
                className="w-24 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              />
              {formData.bath_id && (
                <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                  {(() => {
                    const selectedBath = baths.find((b) => b.bath_id == formData.bath_id);
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

          {/* Контакты */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
              <input
                type="tel"
                name="client_phone"
                value={formData.client_phone}
                onChange={handleChange}
                placeholder="+7 (999) 123-45-67"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
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
              rows="3"
              placeholder="Пожелания клиента..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Веники */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Веники</label>
              <button
                type="button"
                onClick={() => setShowBrooms(!showBrooms)}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                {showBrooms ? 'Скрыть' : 'Показать'}
              </button>
            </div>
            {showBrooms && (
              <>
                {isLoadingBrooms ? (
                  <div className="text-gray-500 py-2">Загрузка веников...</div>
                ) : brooms.length === 0 ? (
                  <div className="text-gray-500 py-2">Нет доступных веников</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                    {brooms.map((broom) => {
                      if (!broom || !broom.id) return null;
                      const current = formData.brooms.find((b) => b.broom_id === broom.id);
                      const quantity = current ? current.quantity : 0;
                      return (
                        <div key={broom.id} className="border border-gray-200 rounded-xl p-3 bg-white">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{broom.name}</span>
                            <span className="text-green-600 font-semibold">{broom.price} ₽</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleBroomChange(broom.id, Math.max(0, quantity - 1))}
                              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-medium">{quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleBroomChange(broom.id, quantity + 1)}
                              className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Массажи */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Массажи</label>
              <button
                type="button"
                onClick={() => setShowMassages(!showMassages)}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                {showMassages ? 'Скрыть' : 'Показать'}
              </button>
            </div>
            {showMassages && (
              <>
                {isLoadingMassages ? (
                  <div className="text-gray-500 py-2">Загрузка массажей...</div>
                ) : massages.length === 0 ? (
                  <div className="text-gray-500 py-2">Нет доступных массажей</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                    {massages.map((massage) => {
                      if (!massage || !massage.massage_id) return null;
                      const current = formData.massages.find((m) => m.massage_id === massage.massage_id);
                      const quantity = current ? current.quantity : 0;
                      return (
                        <div key={massage.massage_id} className="border border-gray-200 rounded-xl p-3 bg-white">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{massage.name}</span>
                            <span className="text-green-600 font-semibold">{massage.cost} ₽</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleMassageChange(massage.massage_id, Math.max(0, quantity - 1))}
                              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-medium">{quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleMassageChange(massage.massage_id, quantity + 1)}
                              className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Кухня */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Кухня</label>
              <button
                type="button"
                onClick={() => setShowKitchen(!showKitchen)}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                {showKitchen ? 'Скрыть' : 'Показать'}
              </button>
            </div>
            {showKitchen && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Категории</label>
                  <div className="border border-gray-300 rounded-xl p-3 max-h-48 overflow-y-auto bg-white">
                    {isLoadingCategories ? (
                      <div className="text-gray-500">Загрузка категорий...</div>
                    ) : categories.length > 0 ? (
                      categories.map((cat) => {
                        const isSelected = selectedCategories.includes(cat.slug);
                        return (
                          <div key={cat.id} className="flex items-center py-2">
                            <input
                              type="checkbox"
                              id={`cat-${cat.id}`}
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCategories((prev) => [...prev, cat.slug]);
                                } else {
                                  setSelectedCategories((prev) => prev.filter((slug) => slug !== cat.slug));
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`cat-${cat.id}`} className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                              {cat.name}
                            </label>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-gray-500">Нет категорий</div>
                    )}
                  </div>
                </div>
                {isLoadingMenuItems ? (
                  <div className="text-gray-500 py-2">Загрузка блюд...</div>
                ) : selectedCategories ? (
                  kitchenItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                      {kitchenItems.map((item) => {
                        if (!item || !item.id) return null;
                        const current = formData.menu_items.find((m) => m.menu_item_id === item.id);
                        const quantity = current ? current.quantity : 0;
                        return (
                          <div key={item.id} className="border border-gray-200 rounded-xl p-3 bg-white">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-green-600 font-semibold">{item.price} ₽</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleMenuItemChange(item.id, Math.max(0, quantity - 1))}
                                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-medium">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleMenuItemChange(item.id, quantity + 1)}
                                className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm py-2">В этой категории пока нет блюд</div>
                  )
                ) : (
                  <div className="text-gray-500 text-sm py-2">Сначала выберите категорию</div>
                )}
              </>
            )}
          </div>

          {/* Кнопки */}
          <div className="pt-4 border-t border-gray-200 flex gap-3">
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Сохранение...' : isEditing ? 'Сохранить изменения' : 'Создать бронь'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-medium hover:bg-gray-300 transition"
            >
              {isEditing ? 'Назад к просмотру' : 'Отмена'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default AddBookingModal;