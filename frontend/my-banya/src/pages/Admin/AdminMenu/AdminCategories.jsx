// src/pages/Admin/AdminMenu/CategoriesManager.jsx

import { useState, useEffect } from 'react';
import {
  useGetMenuCategoriesQuery,
  useCreateMenuCategoryMutation,
  useUpdateMenuCategoryMutation,
  useDeleteMenuCategoryMutation,
} from '../../../redux/slices/apiSlice';

export default function CategoriesManager() {
  const { data: categories = [], isLoading, error } = useGetMenuCategoriesQuery();

  const [createCategory] = useCreateMenuCategoryMutation();
  const [updateCategory] = useUpdateMenuCategoryMutation();
  const [deleteCategory] = useDeleteMenuCategoryMutation();

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ slug: '', name: '', order: 0 });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState({ slug: '', name: '', order: 0 });
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (editingId && categories.length > 0) {
      const cat = categories.find(c => c.id === editingId);
      if (cat) {
        setEditForm({
          slug: cat.slug,
          name: cat.name,
          order: cat.order,
        });
      }
    }
  }, [editingId, categories]);

  const handleEditClick = (category) => {
    setEditingId(category.id);
  };

  const handleSaveEdit = async () => {
    if (!editForm.slug || !editForm.name) return;

    try {
      await updateCategory({
        id: editingId,
        ...editForm,
        order: Number(editForm.order),
      }).unwrap();
      setEditingId(null);
      setEditForm({ slug: '', name: '', order: 0 });
    } catch (err) {
      console.error('Ошибка обновления категории:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ slug: '', name: '', order: 0 });
  };

  const handleAddClick = () => {
    setIsAddingNew(true);
    setNewCategory({ slug: '', name: '', order: 0 });
  };

  const handleAddCategory = async () => {
    if (!newCategory.slug || !newCategory.name) return;

    try {
      await createCategory({
        ...newCategory,
        order: Number(newCategory.order),
      }).unwrap();
      setIsAddingNew(false);
      setNewCategory({ slug: '', name: '', order: 0 });
    } catch (err) {
      console.error('Ошибка создания категории:', err);
    }
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewCategory({ slug: '', name: '', order: 0 });
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCategory(deletingId).unwrap();
      setDeletingId(null);
    } catch (err) {
      console.error('Ошибка удаления категории:', err);
    }
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="text-gray-600">Загрузка категорий...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="text-red-500">Ошибка загрузки: {error.toString()}</div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Категории меню</h2>
        <button
          onClick={handleAddClick}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium shadow-md transition flex items-center space-x-2 text-sm"
        >
          <span>➕</span>
          <span>Добавить категорию</span>
        </button>
      </div>

      {isAddingNew && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Добавить новую категорию</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <input
              type="text"
              placeholder="Slug (латиница, напр. drinks)"
              value={newCategory.slug}
              onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
              autoFocus
            />
            <input
              type="text"
              placeholder="Название категории"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
            />
            <input
              type="number"
              placeholder="Порядок сортировки"
              value={newCategory.order}
              onChange={(e) => setNewCategory({ ...newCategory, order: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
            />
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleAddCategory}
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
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Slug</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Название</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">Порядок</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.length > 0 ? (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  {editingId === category.id ? (
                    <>
                      <td className="px-6 py-4">{category.id}</td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.slug}
                          onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full text-sm"
                        />
                      </td>
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
                          value={editForm.order}
                          onChange={(e) => setEditForm({ ...editForm, order: e.target.value })}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{category.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.slug}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{category.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{category.order}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditClick(category)}
                          className="text-green-600 hover:text-green-900 mr-3 text-xs transition"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category.id)}
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
                  Категории не найдены. Добавьте первую!
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
              Вы действительно хотите удалить категорию? Это может повлиять на товары.
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