// src/pages/Admin/Company/AccessControl/AccessControl.jsx
import { useState, useEffect } from 'react';
import {
  useGetRolesQuery,
  useGetPermissionsQuery,
  useUpdatePermissionMutation
} from '../../../../redux/slices/apiSlice';
import ActionDropdown from '../../../../components/UI/ActionDropdown/ActionDropdown';

function AccessControl() {
  const { data: roles = [], isLoading: isLoadingRoles, isError: isErrorRoles } = useGetRolesQuery();
  const { data: permissions = [], isLoading: isLoadingPerms, isError: isErrorPerms } = useGetPermissionsQuery();
  const [updatePermission] = useUpdatePermissionMutation();

  const [localAccess, setLocalAccess] = useState({}); // { path: Set(roleId) }

  // Инициализация состояния из API
  useEffect(() => {
    if (permissions.length > 0) {
      const map = {};
      permissions.forEach(p => {
        map[p.path] = new Set(p.allowed_roles);
      });
      setLocalAccess(map);
    }
  }, [permissions]);

  const toggleRole = (path, roleId) => {
    setLocalAccess(prev => {
      const newSet = new Set(prev[path] || []);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return { ...prev, [path]: newSet };
    });
  };

  const handleSave = async (permId, path) => {
    const roleIds = Array.from(localAccess[path] || []);
    try {
      await updatePermission({ id: permId, allowed_roles: roleIds }).unwrap();
      alert('Права успешно обновлены');
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Не удалось сохранить права. Проверьте данные.');
    }
  };

  const isLoading = isLoadingRoles || isLoadingPerms;
  const isError = isErrorRoles || isErrorPerms;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Загрузка прав и ролей...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-red-600 text-lg">Ошибка загрузки данных. Попробуйте позже.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Управление правами доступа</h1>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-xl shadow">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3">Страница</th>
                {roles.map(role => (
                  <th key={role.id} className="text-center px-4 py-3">
                    <div className="text-sm font-medium text-gray-700">{role.name}</div>
                  </th>
                ))}
                <th className="text-right px-4 py-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map(perm => (
                <tr key={perm.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{perm.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{perm.path}</div>
                  </td>
                  {roles.map(role => (
                    <td key={role.id} className="text-center px-4 py-3">
                      <input
                        type="checkbox"
                        checked={localAccess[perm.path]?.has(role.id) || false}
                        onChange={() => toggleRole(perm.path, role.id)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <ActionDropdown
                      actions={[
                        {
                          label: 'Сохранить',
                          icon: '💾',
                          color: 'green',
                          onClick: () => handleSave(perm.id, perm.path),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {permissions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Нет настроенных путей. Добавьте записи в таблицу <code className="bg-gray-100 px-1 rounded">page_permissions</code>.
            </div>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {permissions.length > 0 ? (
            permissions.map(perm => (
              <div key={perm.id} className="bg-white rounded-xl shadow p-4 border border-gray-100">
                <div className="font-bold text-gray-900 mb-1">{perm.title}</div>
                <div className="text-xs text-gray-500 mb-3 break-all">{perm.path}</div>

                {/* Горизонтальный скролл для ролей */}
                <div className="overflow-x-auto pb-2 mb-4">
                  <div className="inline-flex space-x-4 min-w-max">
                    {roles.map(role => (
                      <div key={role.id} className="flex items-center whitespace-nowrap">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localAccess[perm.path]?.has(role.id) || false}
                            onChange={() => toggleRole(perm.path, role.id)}
                            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">{role.name}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSave(perm.id, perm.path)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              Нет настроенных путей. Добавьте записи в таблицу <code className="bg-gray-100 px-1 rounded">page_permissions</code>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccessControl;