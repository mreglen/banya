import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetClientsQuery,
  useDeleteClientsMutation,
} from '../../../../redux/slices/apiSlice';
import ActionDropdown from '../../../../components/UI/ActionDropdown/ActionDropdown';
import ClientsSkeleton from './ClientsSkeleton';

function Clients() {
  const navigate = useNavigate();
  const { data: clients = [], isLoading, isError } = useGetClientsQuery();
  const [deleteClients] = useDeleteClientsMutation();
  const [deletingId, setDeletingId] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    full_name: '',
    phone: '',
    email: '',
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredClients = clients.filter(client => {
    return (
      client.full_name.toLowerCase().includes(searchFilters.full_name.toLowerCase()) &&
      (client.phone || '').includes(searchFilters.phone) &&
      (client.email || '').toLowerCase().includes(searchFilters.email.toLowerCase())
    );
  });

  const handleDeleteClick = (id) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteClients(deletingId).unwrap();
      setDeletingId(null);
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить клиента');
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  const handleAddClick = () => {
    navigate('/admin/company/client/add');
  };

  const handleEditClick = (id) => {
    navigate(`/admin/company/client/edit/${id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  if (isLoading) {
    return <ClientsSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <p className="text-red-600">Ошибка загрузки данных</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Клиенты</h1>
            <p className="text-gray-600 mt-1 md:mt-2">Управление списком клиентов</p>
          </div>
          <button
            onClick={handleAddClick}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl font-medium shadow-md transition flex items-center space-x-1 md:space-x-2 w-fit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm md:text-base">Добавить клиента</span>
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ФИО</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Телефон</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
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
                    placeholder="Поиск по ФИО..."
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-normal"
                  />
                </th>
                <th className="px-4 py-2">
                  <input
                    type="text"
                    name="phone"
                    value={searchFilters.phone}
                    onChange={handleFilterChange}
                    placeholder="Поиск по телефону..."
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-normal"
                  />
                </th>
                <th className="px-4 py-2">
                  <input
                    type="text"
                    name="email"
                    value={searchFilters.email}
                    onChange={handleFilterChange}
                    placeholder="Поиск по email..."
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-normal"
                  />
                </th>
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr
                    key={client.client_id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onDoubleClick={() => handleEditClick(client.client_id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {client.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {client.phone || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {client.email || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(client.birth_date)}
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
                            onClick: () => handleEditClick(client.client_id),
                          },
                          {
                            label: 'Удалить',
                            icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            ),
                            color: 'red',
                            onClick: () => handleDeleteClick(client.client_id),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-lg">
                    Клиенты не найдены. Добавьте первого!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <div
                key={client.client_id}
                className="bg-white rounded-xl shadow p-4 border border-gray-100"
              >
                <div className="font-bold text-gray-900 text-lg mb-1">{client.full_name}</div>
                <div className="text-sm text-gray-600 mb-3">
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {client.phone}
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {client.email}
                    </div>
                  )}
                  {client.birth_date && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(client.birth_date)}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleEditClick(client.client_id)}
                    className="flex-1 bg-green-100 text-green-800 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDeleteClick(client.client_id)}
                    className="flex-1 bg-red-100 text-red-800 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              {clients.length > 0 ? 'Клиенты по вашему запросу не найдены.' : 'Клиенты не найдены. Добавьте первого!'}
            </div>
          )}
        </div>

        {/* Модальное окно удаления */}
        {deletingId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Подтвердите удаление</h2>
              <p className="text-gray-600 mb-6">
                Вы действительно хотите удалить клиента? Это действие нельзя отменить.
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

export default Clients;