// src/components/Roles.jsx (или ваш путь)
import { useState } from 'react';
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} from '../../../../../redux/slices/apiSlice';
import ActionDropdown from '../../../../../components/UI/ActionDropdown/ActionDropdown';

function Roles({ isOpen, onClose }) {
  const { data: roles = [], isLoading, refetch } = useGetRolesQuery();
  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const [newRoleName, setNewRoleName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [error, setError] = useState('');

  const validateName = (name) => {
    if (!name?.trim()) {
      setError('Имя роли обязательно');
      return false;
    }
    return true;
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!validateName(newRoleName)) return;

    try {
      await createRole({ name: newRoleName.trim() }).unwrap();
      setNewRoleName('');
      setError('');
    } catch (err) {
      setError(err?.data?.detail || 'Не удалось создать роль');
    }
  };

  const handleEditStart = (role) => {
    setEditId(role.id);
    setEditName(role.name);
    setError('');
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditName('');
    setError('');
  };

  const handleEditSave = async () => {
    if (!validateName(editName)) return;
    try {
      await updateRole({ id: editId, name: editName.trim() }).unwrap();
      setEditId(null);
      setEditName('');
    } catch (err) {
      setError(err?.data?.detail || 'Не удалось обновить роль');
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteRole(deleteConfirmId).unwrap();
      setDeleteConfirmId(null);
      refetch(); // обновить список после удаления
    } catch (err) {
      alert(err?.data?.detail || 'Не удалось удалить роль');
      setDeleteConfirmId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Управление ролями</h2>

        {/* Форма добавления */}
        <form onSubmit={handleCreateRole} className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-3">Добавить новую роль</h3>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Название роли
            </label>
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              placeholder="Менеджер склада"
              required
            />
          </div>
          {error && !editId && <p className="text-red-600 text-sm mt-2">{error}</p>}
          <button
            type="submit"
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            Добавить роль
          </button>
        </form>

        {/* Список ролей */}
        <div>
          <h3 className="font-medium text-gray-800 mb-3">Существующие роли</h3>
          {isLoading ? (
            <p className="text-gray-500">Загрузка...</p>
          ) : roles.length === 0 ? (
            <p className="text-gray-500">Нет ролей</p>
          ) : (
            <ul className="space-y-3">
              {roles.map((role) => (
                <li
                  key={role.id}
                  className="p-3 border border-gray-200 rounded bg-gray-50 flex items-center justify-between"
                >
                  {editId === role.id ? (
                    <div className="flex-1 mr-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        autoFocus
                      />
                      {error && editId === role.id && (
                        <p className="text-red-600 text-xs mt-1">{error}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-800 text-sm">{role.name}</span>
                  )}

                  <ActionDropdown
                    actions={
                      editId === role.id
                        ? [
                            {
                              label: 'Сохранить',
                              icon: '✅',
                              color: 'green',
                              onClick: handleEditSave,
                            },
                            {
                              label: 'Отмена',
                              icon: '❌',
                              color: 'gray',
                              onClick: handleEditCancel,
                            },
                          ]
                        : [
                            {
                              label: 'Редактировать',
                              icon: '✏️',
                              color: 'blue',
                              onClick: () => handleEditStart(role),
                            },
                            {
                              label: 'Удалить',
                              icon: '🗑️',
                              color: 'red',
                              onClick: () => handleDeleteClick(role.id),
                            },
                          ]
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm"
          >
            Закрыть
          </button>
        </div>
      </div>

      {/* Модалка подтверждения удаления */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-2">Удалить роль?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Это действие нельзя отменить. Все пользователи с этой ролью потеряют доступ.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="px-3 py-1.5 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
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

export default Roles;