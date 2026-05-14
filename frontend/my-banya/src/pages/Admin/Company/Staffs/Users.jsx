// src/pages/Admin/Company/Staffs/Users.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useGetUsersQuery, 
  useDeleteUserMutation,
} from '../../../../redux/slices/apiSlice';
import ActionDropdown from '../../../../components/UI/ActionDropdown/ActionDropdown';
import UsersSkeleton from './UsersSkeleton';

function Users() {
  const navigate = useNavigate();
  const { data: users = [], isLoading, isError } = useGetUsersQuery();
  const [deleteUser] = useDeleteUserMutation();

  const [deletingId, setDeletingId] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredUsers = users.filter(user => {
    return (
      user.full_name.toLowerCase().includes(searchFilters.full_name.toLowerCase()) &&
      (user.email || '').toLowerCase().includes(searchFilters.email.toLowerCase()) &&
      (user.phone || '').includes(searchFilters.phone)
    );
  });

  // === Пользователи ===
  const handleDeleteClick = (id) => setDeletingId(id);
  const handleConfirmDelete = async () => {
    try {
      await deleteUser(deletingId).unwrap();
      setDeletingId(null);
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить пользователя');
      setDeletingId(null);
    }
  };
  const handleCancelDelete = () => setDeletingId(null);
  const handleAddClick = () => navigate('/admin/company/user/add');
  const handleEditClick = (id) => navigate(`/admin/company/user/edit/${id}`);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  if (isLoading) {
    return <UsersSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-red-600 text-lg">Ошибка загрузки данных. Попробуйте позже.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Пользователи</h1>
            <p className="text-gray-600 mt-1 md:mt-2">Управление аккаунтами сотрудников</p>
          </div>
          <button
            onClick={handleAddClick}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl font-medium shadow-md transition flex items-center justify-center space-x-1 md:space-x-2 w-fit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm md:text-base">Добавить пользователя</span>
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ФИО</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Телефон</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Роль</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Дата рождения</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
              <tr className="bg-white border-b">
                <th className="px-4 py-2">
                  <input
                    type="text"
                    name="full_name"
                    value={searchFilters.full_name}
                    onChange={handleFilterChange}
                    placeholder="Поиск..."
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-normal"
                  />
                </th>
                <th className="px-4 py-2">
                  <input
                    type="text"
                    name="email"
                    value={searchFilters.email}
                    onChange={handleFilterChange}
                    placeholder="Email..."
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-normal"
                  />
                </th>
                <th className="px-4 py-2">
                  <input
                    type="text"
                    name="phone"
                    value={searchFilters.phone}
                    onChange={handleFilterChange}
                    placeholder="Телефон..."
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-normal"
                  />
                </th>
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.user_id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onDoubleClick={() => handleEditClick(user.user_id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.email || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.phone || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.role_rel?.name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-wrap gap-1">
                        {user.is_admin && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Админ
                          </span>
                        )}
                        {user.is_director && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Директор
                          </span>
                        )}
                        {!user.is_admin && !user.is_director && (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(user.birth_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ActionDropdown
                        actions={[
                          {
                            label: 'Редактировать',
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            ),
                            color: 'green',
                            onClick: () => handleEditClick(user.user_id),
                          },
                          {
                            label: 'Удалить',
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            ),
                            color: 'red',
                            onClick: () => handleDeleteClick(user.user_id),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 text-lg">
                    {users.length > 0 ? 'Пользователи по вашему запросу не найдены.' : 'Пользователи не найдены. Добавьте первого!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user.user_id}
                className="bg-white rounded-xl shadow p-4 border border-gray-100"
              >
                <div className="font-bold text-gray-900 text-lg mb-2">{user.full_name}</div>
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {user.email || '—'}
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {user.phone}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      Роль: {user.role_rel?.name || '—'}
                    </span>
                    {user.is_admin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Администратор
                      </span>
                    )}
                    {user.is_director && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Директор
                      </span>
                    )}
                    {!user.is_admin && !user.is_director && (
                      <span className="text-gray-400">Пользователь</span>
                    )}
                  </div>
                  {user.birth_date && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(user.birth_date)}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleEditClick(user.user_id)}
                    className="flex-1 bg-green-100 text-green-800 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDeleteClick(user.user_id)}
                    className="flex-1 bg-red-100 text-red-800 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              {users.length > 0 ? 'Пользователи по вашему запросу не найдены.' : 'Пользователи не найдены. Добавьте первого!'}
            </div>
          )}
        </div>

        {/* Модальное окно удаления */}
        {deletingId !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Подтвердите удаление</h2>
              <p className="text-gray-600 mb-6">
                Вы действительно хотите удалить пользователя? Это действие нельзя отменить.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition text-sm"
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

export default Users;