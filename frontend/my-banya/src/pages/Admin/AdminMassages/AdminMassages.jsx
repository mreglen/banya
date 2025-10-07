import { useState } from 'react';
import {
  useGetMassagesQuery,
  useCreateMassageMutation,
  useUpdateMassageMutation,
  useDeleteMassageMutation,
} from '../../../redux/slices/apiSlice';

function AdminMassages() {
  // Загружаем данные из API
  const { data: massages, isLoading, error } = useGetMassagesQuery();

  // Мутации
  const [createMassage] = useCreateMassageMutation();
  const [updateMassage] = useUpdateMassageMutation();
  const [deleteMassage] = useDeleteMassageMutation();

  // Формы
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', cost: '' });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newMassage, setNewMassage] = useState({ name: '', description: '', cost: '' });
  const [deletingId, setDeletingId] = useState(null);

  // Открыть форму редактирования
  const handleEditClick = (massage) => {
    setEditingId(massage.massage_id);
    setEditForm({
      name: massage.name,
      description: massage.description,
      cost: massage.cost,
    });
  };

  // Сохранить изменения
  const handleSaveEdit = async () => {
    if (!editForm.name || !editForm.description || !editForm.cost) return;

    try {
      await updateMassage({
        massage_id: editingId,
        name: editForm.name,
        description: editForm.description,
        cost: Number(editForm.cost),
      }).unwrap();
      setEditingId(null);
      setEditForm({ name: '', description: '', cost: '' });
    } catch (err) {
      console.error('Ошибка обновления:', err);
    }
  };

  // Отменить редактирование
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', description: '', cost: '' });
  };

  // Открыть форму добавления
  const handleAddClick = () => {
    setIsAddingNew(true);
    setNewMassage({ name: '', description: '', cost: '' });
  };

  // Добавить новый массаж
  const handleAddMassage = async () => {
    if (!newMassage.name || !newMassage.description || !newMassage.cost) return;

    try {
      await createMassage({
        name: newMassage.name,
        description: newMassage.description,
        cost: Number(newMassage.cost),
      }).unwrap();
      setIsAddingNew(false);
      setNewMassage({ name: '', description: '', cost: '' });
    } catch (err) {
      console.error('Ошибка создания:', err);
    }
  };

  // Отменить добавление
  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewMassage({ name: '', description: '', cost: '' });
  };

  // Открыть подтверждение удаления
  const handleDeleteClick = (id) => {
    setDeletingId(id);
  };

  // Подтвердить удаление
  const handleConfirmDelete = async () => {
    try {
      await deleteMassage(deletingId).unwrap();
      setDeletingId(null);
    } catch (err) {
      console.error('Ошибка удаления:', err);
    }
  };

  // Отменить удаление
  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  // Загрузка
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-600">Загрузка массажей...</div>
      </div>
    );
  }

  // Ошибка
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
          <h1 className="text-3xl font-bold text-gray-800">Массажи</h1>
          <p className="text-gray-600 mt-2">Управление ассортиментом массажей для бани</p>
        </div>

        {/* Кнопка "Добавить массаж" */}
        <div className="mb-8 flex justify-end">
          <button
            onClick={handleAddClick}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium shadow-md transition flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Добавить массаж</span>
          </button>
        </div>

        {/* Форма добавления нового массажа */}
        {isAddingNew && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Добавить новый массаж</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <input
                type="text"
                placeholder="Название массажа"
                value={newMassage.name}
                onChange={(e) => setNewMassage({ ...newMassage, name: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                autoFocus
              />
              <input
                type="number"
                placeholder="Цена (₽)"
                value={newMassage.cost}
                onChange={(e) => setNewMassage({ ...newMassage, cost: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
              />
            </div>
            <div className="mb-6">
              <textarea
                placeholder="Описание массажа"
                value={newMassage.description}
                onChange={(e) => setNewMassage({ ...newMassage, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="3"
              ></textarea>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleAddMassage}
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

        {/* Таблица массажей */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Название</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Цена</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Описание</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {massages && massages.length > 0 ? (
                massages.map((massage) => (
                  <tr key={massage.massage_id} className="hover:bg-gray-50">
                    {editingId === massage.massage_id ? (
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
                            value={editForm.cost}
                            onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
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
                          {massage.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {massage.cost} ₽
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate">
                          {massage.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditClick(massage)}
                            className="text-green-600 hover:text-green-900 mr-4 transition"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleDeleteClick(massage.massage_id)}
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
                    Массажи не найдены. Добавьте первый!
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
                Вы действительно хотите удалить массаж? Это действие нельзя отменить.
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

export default AdminMassages;