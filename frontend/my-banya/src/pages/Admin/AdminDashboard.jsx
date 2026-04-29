// src/pages/Admin/AdminDashboard.jsx
import { NavLink } from 'react-router-dom';
import { 
  useGetDashboardStatisticsQuery,
  useGetRevenueChartDataQuery,
  useGetReservationsChartDataQuery,
  useGetPopularBathsQuery,
  useGetRecentActivityQuery
} from '../../redux/slices/dashboardApiSlice';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import AdminDashboardSkeleton from './AdminDashboardSkeleton';

function AdminDashboard() {
  const currentDate = new Date();
  const greeting = currentDate.getHours() < 12 ? 'Доброе утро' : currentDate.getHours() < 18 ? 'Добрый день' : 'Добрый вечер';

  // Загрузка данных
  const { data: stats, isLoading: statsLoading } = useGetDashboardStatisticsQuery();
  const { data: revenueData, isLoading: revenueLoading } = useGetRevenueChartDataQuery(30);
  const { data: reservationsData, isLoading: reservationsLoading } = useGetReservationsChartDataQuery(30);
  const { data: popularBaths, isLoading: bathsLoading } = useGetPopularBathsQuery();
  const { data: recentActivity, isLoading: activityLoading } = useGetRecentActivityQuery(10);

  // Показываем скелетон при загрузке
  if (statsLoading || revenueLoading || reservationsLoading) {
    return <AdminDashboardSkeleton />;
  }

  // Цвета для графиков
  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  // Форматирование валюты
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Форматирование даты
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Иконка действия
  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE':
        return (
          <div className="p-2 bg-green-100 rounded-lg">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case 'UPDATE':
        return (
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      case 'DELETE':
        return (
          <div className="p-2 bg-red-100 rounded-lg">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 bg-gray-100 rounded-lg">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {greeting}!
        </h1>
        <p className="text-gray-600">
          Добро пожаловать в панель управления Николаевские бани
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1">
            {stats?.reservations?.today || 0}
          </h3>
          <p className="text-gray-600 text-sm">Бронирований сегодня</p>
          <div className="mt-2 text-xs text-gray-500">
            {stats?.reservations?.this_week || 0} за неделю
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            {formatCurrency(stats?.revenue?.today || 0)}
          </h3>
          <p className="text-gray-600 text-sm">Доход сегодня</p>
          <div className="mt-2 text-xs text-gray-500">
            {formatCurrency(stats?.revenue?.this_week || 0)} за неделю
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1">
            {stats?.clients?.total || 0}
          </h3>
          <p className="text-gray-600 text-sm">Клиентов всего</p>
          <div className="mt-2 text-xs text-gray-500">
            {stats?.baths?.total || 0} бань доступно
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {stats?.bookings?.unread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {stats?.bookings?.unread}
              </span>
            )}
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1">
            {stats?.bookings?.total || 0}
          </h3>
          <p className="text-gray-600 text-sm">Заявок с сайта</p>
          <div className="mt-2 text-xs text-gray-500">
            {stats?.bookings?.unread || 0} непрочитанных
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Доход за 30 дней</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 8 }}
                name="Доход"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Reservations Chart */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Бронирования за 30 дней</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reservationsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="count" 
                fill="#3b82f6"
                name="Бронирования"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popular Baths */}
      {popularBaths && popularBaths.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Популярность бань (этот месяц)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={popularBaths}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="reservation_count"
                  >
                    {popularBaths.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Stats Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 text-gray-600">Баня</th>
                    <th className="text-center py-2 px-4 text-gray-600">Бронирований</th>
                    <th className="text-right py-2 px-4 text-gray-600">Доход</th>
                  </tr>
                </thead>
                <tbody>
                  {popularBaths.map((bath, index) => (
                    <tr key={bath.bath_id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{bath.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">{bath.reservation_count}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {formatCurrency(bath.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Quick Navigation */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Быстрая навигация</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NavLink
            to="/admin/reservations"
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg hover:bg-green-50 transition group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Бронирование</h3>
                <p className="text-gray-600 text-sm">Управление бронированиями и записями</p>
              </div>
            </div>
          </NavLink>

          <NavLink
            to="/admin/baths"
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg hover:bg-purple-50 transition group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Бани</h3>
                <p className="text-gray-600 text-sm">Настройка бань и услуг</p>
              </div>
            </div>
          </NavLink>

          <NavLink
            to="/admin/documents/entrance"
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg hover:bg-orange-50 transition group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Документы</h3>
                <p className="text-gray-600 text-sm">Поступление и реализация</p>
              </div>
            </div>
          </NavLink>

          <NavLink
            to="/admin/storage/nomenclature"
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg hover:bg-teal-50 transition group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Склад</h3>
                <p className="text-gray-600 text-sm">Управление товарами и остатками</p>
              </div>
            </div>
          </NavLink>

          <NavLink
            to="/admin/bookings"
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg hover:bg-pink-50 transition group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Заявки с сайта</h3>
                <p className="text-gray-600 text-sm">Обработка онлайн-заявок</p>
              </div>
            </div>
          </NavLink>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Последняя активность</h2>
        {activityLoading ? (
          <div className="text-center py-8 text-gray-500">
            <p>Загрузка...</p>
          </div>
        ) : recentActivity && recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition border border-gray-100"
              >
                {getActionIcon(activity.action)}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {activity.summary || `${activity.action} ${activity.entity_type}`}
                      </p>
                      {activity.client_name && (
                        <p className="text-sm text-gray-600 mt-1">
                          Клиент: {activity.client_name}
                        </p>
                      )}
                      {activity.bath_name && (
                        <p className="text-sm text-gray-600">
                          Баня: {activity.bath_name}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {formatDateTime(activity.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Пока нет активности</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;