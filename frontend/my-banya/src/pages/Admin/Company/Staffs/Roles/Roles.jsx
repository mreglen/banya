import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetNewPermissionsQuery,
} from '../../../../../redux/slices/apiSlice';
import ActionDropdown from '../../../../../components/UI/ActionDropdown/ActionDropdown';

function Roles() {
  const navigate = useNavigate();
  const { data: roles = [], isLoading } = useGetRolesQuery();
  const { data: permissions = [] } = useGetNewPermissionsQuery();
  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [error, setError] = useState('');

  const getActionKey = (permission) => {
    if (permission.code?.includes(':')) return permission.code.split(':')[1];
    if (permission.code?.includes('_')) return permission.code.split('_').pop();
    return permission.code || permission.name || '';
  };

  const getCategoryName = (category) => {
    const names = {
      reservations: 'Бронирования',
      bookings: 'Заявки с сайта',
      baths: 'Бани',
      storage: 'Склад',
      clients: 'Клиенты',
      partners: 'Партнёры',
      staff: 'Сотрудники',
      documents: 'Документы',
      promotions: 'Акции',
      administrator: 'Администрирование',
    };
    return names[category] || category;
  };

  const getActionName = (action) => {
    const names = {
      view: 'Просмотр',
      create: 'Создание',
      edit: 'Редактирование',
      update: 'Редактирование',
      delete: 'Удаление',
      manage: 'Управление',
      roles: 'Роли',
      audit: 'Аудит',
    };
    return names[action] || action;
  };

  const permissionsGrid = useMemo(() => {
    const pages = [];
    const pagesSet = new Set();
    const actions = [];
    const actionsSet = new Set();
    const matrix = {};

    permissions.forEach((permission) => {
      if (permission.category === 'clients') return;
      const page = permission.category || 'other';
      const action = getActionKey(permission);
      if (!pagesSet.has(page)) {
        pagesSet.add(page);
        pages.push(page);
      }
      if (!actionsSet.has(action)) {
        actionsSet.add(action);
        actions.push(action);
      }
      if (!matrix[page]) matrix[page] = {};
      if (!matrix[page][action]) matrix[page][action] = [];
      matrix[page][action].push(permission);
    });

    return { pages, actions, matrix };
  }, [permissions]);

  const openCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setSelectedPermissionIds([]);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setRoleName(role.name || '');
    setSelectedPermissionIds((role.permissions || []).map((p) => p.id));
    setError('');
    setModalOpen(true);
  };

  const togglePermission = (permissionId, checked) => {
    setSelectedPermissionIds((prev) => {
      if (checked) return prev.includes(permissionId) ? prev : [...prev, permissionId];
      return prev.filter((id) => id !== permissionId);
    });
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      setError('Имя роли обязательно');
      return;
    }
    try {
      const payload = { name: roleName.trim(), permission_ids: selectedPermissionIds };
      if (editingRole) {
        await updateRole({ id: editingRole.id, ...payload }).unwrap();
      } else {
        await createRole(payload).unwrap();
      }
      setModalOpen(false);
      setEditingRole(null);
      setRoleName('');
      setSelectedPermissionIds([]);
    } catch (err) {
      setError(err?.data?.detail || 'Не удалось сохранить роль');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteRole(deleteConfirmId).unwrap();
      setDeleteConfirmId(null);
    } catch (err) {
      alert(err?.data?.detail || 'Не удалось удалить роль');
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/admin/administrator')}
          className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
        >
          Вернуться
        </button>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Роли</h1>
            <p className="text-gray-600 mt-1">Назначение ролей и прав доступа</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition"
          >
            Добавить роль
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-visible">
          {isLoading ? (
            <div className="p-6 text-gray-500">Загрузка...</div>
          ) : roles.length === 0 ? (
            <div className="p-6 text-gray-500">Роли не найдены</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase">Название роли</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 uppercase">Количество прав</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onDoubleClick={() => openEditModal(role)}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{role.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{(role.permissions || []).length}</td>
                    <td className="px-6 py-4 text-right relative overflow-visible">
                      <ActionDropdown
                        actions={[
                          {
                            label: 'Редактировать',
                            icon: '✏️',
                            color: 'blue',
                            onClick: () => openEditModal(role),
                          },
                          {
                            label: 'Удалить',
                            icon: '🗑️',
                            color: 'red',
                            onClick: () => setDeleteConfirmId(role.id),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {editingRole ? 'Редактировать роль' : 'Новая роль'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[65vh] space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название роли</label>
                <input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder="Например: Менеджер"
                />
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="min-w-[720px] w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">Страница</th>
                      {permissionsGrid.actions.map((action) => (
                        <th key={action} className="px-4 py-3 text-sm font-semibold text-gray-700 text-center whitespace-nowrap">
                          {getActionName(action)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissionsGrid.pages.map((page) => (
                      <tr key={page} className="border-b border-gray-100 last:border-b-0">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800 sticky left-0 bg-white z-10 border-r border-gray-200">
                          {getCategoryName(page)}
                        </td>
                        {permissionsGrid.actions.map((action) => {
                          const cellPermissions = permissionsGrid.matrix[page]?.[action] || [];
                          return (
                            <td key={`${page}-${action}`} className="px-4 py-3 text-center">
                              {cellPermissions.length > 0 ? (
                                <input
                                  type="checkbox"
                                  checked={cellPermissions.every((perm) => selectedPermissionIds.includes(perm.id))}
                                  onChange={(e) => {
                                    cellPermissions.forEach((perm) => togglePermission(perm.id, e.target.checked));
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveRole}
                className="px-5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-800 mb-2">Удалить роль?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Это действие нельзя отменить. Пользователи с этой ролью останутся без роли.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
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