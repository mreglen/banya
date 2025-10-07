// src/pages/Admin/AdminBrooms/AdminBrooms.jsx
import { useState } from 'react';
import {
  useGetBroomsQuery,
  useCreateBroomMutation,
  useUpdateBroomMutation,
  useDeleteBroomMutation,
} from '../../../redux/slices/apiSlice';

function AdminBrooms() {
  // Загружаем данные из API
  const { data: brooms, isLoading, error } = useGetBroomsQuery();

  // Мутации (все асинхронные)
  const [createBroom] = useCreateBroomMutation();
  const [updateBroom] = useUpdateBroomMutation();
  const [deleteBroom] = useDeleteBroomMutation();

  // Состояние форм
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', quantity: '' });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newBroom, setNewBroom] = useState({ name: '', price: '', quantity: '' });
  const [deletingId, setDeletingId] = useState(null);

  // Открыть форму редактирования
  const handleEditClick = (broom) => {
    setEditingId(broom.id);
    setEditForm({
      name: broom.name,
      price: broom.price,
      quantity: broom.quantity,
    });
  };

  // Сохранить изменения
  const handleSaveEdit = async () => {
    if (!editForm.name || !editForm.price || !editForm.quantity) return;

    try {
      await updateBroom({
        id: editingId,
        name: editForm.name,
        price: Number(editForm.price),
        quantity: Number(editForm.quantity),
      }).unwrap();
      setEditingId(null);
      setEditForm({ name: '', price: '', quantity: '' });
    } catch (err) {
      console.error('Ошибка обновления:', err);
    }
  };

  // Отменить редактирование
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', price: '', quantity: '' });
  };

  // Открыть форму добавления
  const handleAddClick = () => {
    setIsAddingNew(true);
    setNewBroom({ name: '', price: '', quantity: '' });
  };

  // Добавить новый венник
  const handleAddBroom = async () => {
    if (!newBroom.name || !newBroom.price || !newBroom.quantity) return;

    try {
      await createBroom({
        name: newBroom.name,
        price: Number(newBroom.price),
        quantity: Number(newBroom.quantity),
      }).unwrap();
      setIsAddingNew(false);
      setNewBroom({ name: '', price: '', quantity: '' });
    } catch (err) {
      console.error('Ошибка создания:', err);
    }
  };

  // Отменить добавление
  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewBroom({ name: '', price: '', quantity: '' });
  };

  // Открыть подтверждение удаления
  const handleDeleteClick = (id) => {
    setDeletingId(id);
  };

  // Подтвердить удаление
  const handleConfirmDelete = async () => {
    try {
      await deleteBroom(deletingId).unwrap();
      setDeletingId(null);
    } catch (err) {
      console.error('Ошибка удаления:', err);
    }
  };

  // Отменить удаление
  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  // Если загружаем — показываем спиннер
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-600">Загрузка веников...</div>
      </div>
    );
  }

  // Если ошибка — показываем сообщение
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto text-red-500">Ошибка загрузки: {error.toString()}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Веники</h1>
          <p className="text-gray-600 mt-2">Управление ассортиментом веников для бани</p>
        </div>

        {/* Кнопка "Добавить венник" */}
        <div className="mb-8 flex justify-end">
          <button
            onClick={handleAddClick}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium shadow-md transition flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Добавить венник</span>
          </button>
        </div>

        {/* Форма добавления нового веника */}
        {isAddingNew && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Добавить новый венник</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <input
                type="text"
                placeholder="Название веника"
                value={newBroom.name}
                onChange={(e) => setNewBroom({ ...newBroom, name: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                autoFocus
              />
              <input
                type="number"
                placeholder="Цена (₽)"
                value={newBroom.price}
                onChange={(e) => setNewBroom({ ...newBroom, price: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
              />
              <input
                type="number"
                placeholder="Количество"
                value={newBroom.quantity}
                onChange={(e) => setNewBroom({ ...newBroom, quantity: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleAddBroom}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium shadow transition"
              >
                Добавить
              </button>
              <button
                onClick={handleCancelAdd}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-medium shadow transition"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Таблица веников */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Название</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Количество</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Цена</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {brooms && brooms.length > 0 ? (
                brooms.map((broom) => (
                  <tr key={broom.id} className="hover:bg-gray-50">
                    {editingId === broom.id ? (
                      // Режим редактирования
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow transition"
                            >
                              Сохранить
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium shadow transition"
                            >
                              Отмена
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // Режим просмотра
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {broom.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {broom.quantity} шт.
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {broom.price} ₽
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditClick(broom)}
                            className="text-green-600 hover:text-green-900 mr-4 transition"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleDeleteClick(broom.id)}
                            className="text-red-600 hover:text-red-900 transition"
                          >
                            Удалить
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500 text-lg">
                    Веники не найдены. Добавьте первый!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Модальное окно подтверждения удаления */}
        {deletingId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Подтвердите удаление</h2>
              <p className="text-gray-600 mb-6">
                Вы действительно хотите удалить венник? Это действие нельзя отменить.
              </p>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCancelDelete}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-xl font-medium hover:bg-gray-400 transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminBrooms;