// src/pages/Admin/AdminMenu/ItemsManager.jsx

import { useState, useEffect } from 'react';
import {
  useGetMenuCategoriesQuery,
  useGetAllMenuItemsQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
} from '../../../redux/slices/apiSlice';

export default function ItemsManager() {
  const { data: categories = [], isLoading: loadingCategories } = useGetMenuCategoriesQuery();
  const { data: items = [], isLoading, error } = useGetAllMenuItemsQuery();

  const [createItem] = useCreateMenuItemMutation();
  const [updateItem] = useUpdateMenuItemMutation();
  const [deleteItem] = useDeleteMenuItemMutation();

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', category_id: '' });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category_id: '' });
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (editingId && items.length > 0) {
      const item = items.find(i => i.id === editingId);
      if (item) {
        setEditForm({
          name: item.name,
          description: item.description,
          price: item.price,
          category_id: item.category.id,
        });
      }
    }
  }, [editingId, items]);

  const handleEditClick = (item) => {
    setEditingId(item.id);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name || !editForm.price || !editForm.category_id) return;

    try {
      await updateItem({
        id: editingId,
        ...editForm,
        price: Number(editForm.price),
        category_id: Number(editForm.category_id),
      }).unwrap();
      setEditingId(null);
      setEditForm({ name: '', description: '', price: '', category_id: '' });
    } catch (err) {
      console.error('Ошибка обновления товара:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', description: '', price: '', category_id: '' });
  };

  const handleAddClick = () => {
    setIsAddingNew(true);
    setNewItem({
      name: '',
      description: '',
      price: '',
      category_id: categories.length > 0 ? categories[0].id : '',
    });
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category_id) return;

    try {
      await createItem({
        ...newItem,
        price: Number(newItem.price),
        category_id: Number(newItem.category_id),
      }).unwrap();
      setIsAddingNew(false);
      setNewItem({ name: '', description: '', price: '', category_id: '' });
    } catch (err) {
      console.error('Ошибка создания товара:', err);
    }
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewItem({ name: '', description: '', price: '', category_id: '' });
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteItem(deletingId).unwrap();
      setDeletingId(null);
    } catch (err) {
      console.error('Ошибка удаления товара:', err);
    }
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  if (isLoading || loadingCategories) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-gray-600">Загрузка товаров...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-red-500">Ошибка загрузки: {error.toString()}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Товары меню</h2>
        <button
          onClick={handleAddClick}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium shadow-md transition flex items-center space-x-2 text-sm"
        >
          <span>➕</span>
          <span>Добавить товар</span>
        </button>
      </div>

      {isAddingNew && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Добавить новый товар</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <input
              type="text"
              placeholder="Название товара"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
              autoFocus
            />
            <input
              type="number"
              placeholder="Цена (₽)"
              value={newItem.price}
              onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
            />
            <select
              value={newItem.category_id}
              onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
            >
              <option value="">Выберите категорию</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-6">
            <textarea
              placeholder="Описание товара"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              rows="3"
            ></textarea>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleAddItem}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-medium shadow transition text-sm"
            >
              Добавить
            </button>
            <button
              onClick={handleCancelAdd}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-xl font-medium shadow transition text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Название</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Цена</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Категория</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Описание</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {editingId === item.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full text-sm"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={editForm.price}
                          onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full text-sm"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={editForm.category_id}
                          onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full text-sm"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full text-sm"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium shadow transition"
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded text-xs font-medium shadow transition"
                          >
                            Отмена
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.price} ₽
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="text-green-600 hover:text-green-900 mr-3 text-xs transition"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item.id)}
                          className="text-red-600 hover:text-red-900 text-xs transition"
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
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-sm">
                  Товары не найдены. Добавьте первый!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deletingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Подтвердите удаление</h2>
            <p className="text-gray-600 mb-6">
              Вы действительно хотите удалить товар? Это действие нельзя отменить.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition text-sm"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition text-sm"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}