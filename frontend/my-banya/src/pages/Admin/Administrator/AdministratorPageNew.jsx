import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { useGetAuditLogsQuery, useGetUsersQuery } from '../../../redux/slices/apiSlice';
import AuditLogDetailsModal from './AuditLogDetailsModal';

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (вне компонента для оптимизации)
// ============================================================

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const getActionColor = (action) => {
  switch (action) {
    case 'CREATE': return 'bg-green-100 text-green-800';
    case 'UPDATE': return 'bg-blue-100 text-blue-800';
    case 'DELETE': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getEntityTypeName = (entityType) => {
  const names = {
    reservation: 'Бронирование',
    user: 'Пользователь',
    product: 'Товар',
    category: 'Категория',
    partner: 'Партнёр',
    client: 'Клиент',
    bath: 'Баня',
    promotion: 'Акция',
    booking: 'Заявка',
    settings: 'Настройки',
  };
  return names[entityType] || entityType;
};

const INITIAL_FILTERS = {
  skip: 0,
  limit: 50,
  entity_type: '',
  action: '',
  user_id: '',
};

// ============================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================

function AdministratorPageNew() {
  // 1. Сначала ВСЕ хуки (до любых условий)
  const { user } = useSelector((state) => state.auth);
  const { data: users = [] } = useGetUsersQuery();
  
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const { data: auditLogs = [], isLoading, error } = useGetAuditLogsQuery(filters);
  const [selectedLog, setSelectedLog] = useState(null);

  // 2. Обработчики с useCallback для оптимизации (ВСЕ хуки до условий!)
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      skip: 0,
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const handlePreviousPage = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      skip: Math.max(0, prev.skip - prev.limit),
    }));
  }, []);

  const handleNextPage = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      skip: prev.skip + prev.limit,
    }));
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedLog(null);
  }, []);

  // 3. Проверка прав ПОСЛЕ всех хуков
  if (!user?.is_admin) {
    return <Navigate to="/admin/reservations" replace />;
  }

  // 4. Рендер
  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-8">
          🔐 Панель администратора
        </h1>

        {/* Журнал аудита */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-5 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">
            📋 Журнал аудита
          </h2>

          {/* Фильтры */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Сотрудник
              </label>
              <select
                value={filters.user_id}
                onChange={(e) => handleFilterChange('user_id', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Все сотрудники</option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.full_name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип сущности
              </label>
              <select
                value={filters.entity_type}
                onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Все</option>
                <option value="reservation">Бронирования</option>
                <option value="user">Пользователи</option>
                <option value="product">Товары</option>
                <option value="category">Категории</option>
                <option value="partner">Партнёры</option>
                <option value="client">Клиенты</option>
                <option value="bath">Бани</option>
                <option value="promotion">Акции</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Действие
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Все</option>
                <option value="CREATE">Создание</option>
                <option value="UPDATE">Обновление</option>
                <option value="DELETE">Удаление</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>

          {/* Таблица логов */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-2 text-gray-600">Загрузка...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              Ошибка загрузки данных: {error.message}
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Нет данных для отображения
            </div>
          ) : (
            <>
            <div className="md:hidden space-y-3">
              {auditLogs.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  className="w-full text-left border border-gray-200 rounded-xl p-3 bg-white active:bg-gray-50 transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs text-gray-500">{formatDate(log.created_at)}</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {log.user_full_name || 'Неизвестно'}
                  </div>
                  <div className="text-sm text-gray-700 mb-1">
                    {getEntityTypeName(log.entity_type)}{log.entity_id ? ` #${log.entity_id}` : ''}
                  </div>
                  <div className="text-xs text-gray-500">
                    IP: {log.ip_address || '-'}
                  </div>
                </button>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Время
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Пользователь
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действие
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сущность
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP адрес
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.user_full_name || 'Неизвестно'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getEntityTypeName(log.entity_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.entity_id || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}

          {/* Модальное окно деталей */}
          {selectedLog && (
            <AuditLogDetailsModal 
              log={selectedLog} 
              onClose={handleCloseModal} 
            />
          )}

          {/* Пагинация */}
          {auditLogs.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                onClick={handlePreviousPage}
                disabled={filters.skip === 0}
                className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Предыдущая
              </button>
              <span className="text-center text-sm text-gray-700">
                Показано {auditLogs.length} записей
              </span>
              <button
                onClick={handleNextPage}
                disabled={auditLogs.length < filters.limit}
                className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Следующая
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdministratorPageNew;
