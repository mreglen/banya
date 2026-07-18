// src/pages/Admin/AdminDashboard.jsx
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { 
  useGetDashboardStatisticsQuery,
  useGetRevenueChartDataQuery,
  useGetReservationsChartDataQuery,
  useGetBookingsChartDataQuery,
  useGetPopularBathsQuery,
  useGetRecentActivityQuery
} from '../../redux/slices/dashboardApiSlice';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  MousePointer2, 
  Home as HomeIcon, 
  Package, 
  ClipboardList, 
  History,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Trash2,
  Info
} from 'lucide-react';
import AdminDashboardSkeleton from './AdminDashboardSkeleton';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

function AdminDashboard() {
  const { user } = useSelector((state) => state.auth);
  const currentDate = new Date();
  const hours = currentDate.getHours();
  const greeting = hours < 6 ? 'Доброй ночи' : hours < 12 ? 'Доброе утро' : hours < 18 ? 'Добрый день' : 'Добрый вечер';
  const userName = user?.full_name?.trim() || 'Администратор';

  const [revenuePeriod, setRevenuePeriod] = useState('month');

  // Загрузка данных
  const { data: stats, isLoading: statsLoading } = useGetDashboardStatisticsQuery();
  const { data: revenueData, isLoading: revenueLoading } = useGetRevenueChartDataQuery(revenuePeriod);
  const { data: reservationsData, isLoading: reservationsLoading } = useGetReservationsChartDataQuery(14);
  const { data: bookingsData, isLoading: bookingsLoading } = useGetBookingsChartDataQuery(14);
  const { data: popularBaths, isLoading: bathsLoading } = useGetPopularBathsQuery();
  const { data: recentActivity, isLoading: activityLoading } = useGetRecentActivityQuery(8);

  // Объединение данных для графика активности (Бронирования vs Заявки)
  const activityChartData = useMemo(() => {
    if (!reservationsData || !bookingsData) return [];
    
    return reservationsData.map((res) => {
        const book = bookingsData.find(b => b.full_date === res.full_date) || { count: 0 };
        return {
            date: res.date,
            reservations: res.count,
            bookings: book.count
        };
    });
  }, [reservationsData, bookingsData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return <Plus className="w-4 h-4 text-green-500" />;
      case 'UPDATE': return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'DELETE': return <Trash2 className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  if (statsLoading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-gray-50/50 min-h-screen">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {greeting}, {userName}!
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {currentDate.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NavLink 
            to="/admin/reservations" 
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-200 transition-all transform hover:scale-105 flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Новая бронь
          </NavLink>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="p-3 bg-green-50 w-fit rounded-2xl mb-4">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Выручка сегодня</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(stats?.revenue?.today || 0)}
            </h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-lg">
              <ArrowUpRight className="w-3 h-3" />
              {formatCurrency(stats?.revenue?.this_week || 0)} за неделю
            </div>
          </div>
        </div>

        {/* Reservations Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="p-3 bg-blue-50 w-fit rounded-2xl mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Бронирований сегодня</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {stats?.reservations?.today || 0}
            </h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3" />
              {stats?.reservations?.this_week || 0} за неделю
            </div>
          </div>
        </div>

        {/* New Bookings Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="p-3 bg-orange-50 w-fit rounded-2xl mb-4">
              <MousePointer2 className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Заявок с сайта</p>
            <div className="flex items-end gap-2 mt-1">
              <h3 className="text-2xl font-bold text-gray-900">
                {stats?.bookings?.unread || 0}
              </h3>
              <span className="text-sm text-gray-400 pb-1">новых</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-orange-600 bg-orange-50 w-fit px-2 py-1 rounded-lg">
              {stats?.bookings?.total || 0} всего за месяц
            </div>
          </div>
        </div>

        {/* Clients Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="p-3 bg-purple-50 w-fit rounded-2xl mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-gray-500 text-sm font-medium">База клиентов</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {stats?.clients?.total || 0}
            </h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-purple-600 bg-purple-50 w-fit px-2 py-1 rounded-lg">
              {stats?.baths?.total || 0} бань в системе
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Dynamics Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Динамика выручки</h2>
              <p className="text-gray-500 text-sm">Объем продаж за выбранный период</p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
              {[
                { id: 'day', label: 'День' },
                { id: 'week', label: 'Неделя' },
                { id: 'month', label: 'Месяц' },
                { id: 'year', label: 'Год' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setRevenuePeriod(p.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    revenuePeriod === p.id
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[350px] w-full">
            {revenueLoading ? (
              <div className="w-full h-full bg-gray-50 rounded-2xl animate-pulse flex items-center justify-center">
                <span className="text-gray-400 text-sm">Загрузка данных...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(val) => `${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [formatCurrency(value), 'Выручка']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Activity Chart (Reservations vs Bookings) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900">Активность</h2>
            <p className="text-gray-500 text-sm">Сравнение броней и заявок</p>
          </div>
          <div className="h-[350px] w-full">
            {reservationsLoading || bookingsLoading ? (
              <div className="w-full h-full bg-gray-50 rounded-2xl animate-pulse flex items-center justify-center">
                <span className="text-gray-400 text-sm">Загрузка данных...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityChartData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip 
                     contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="reservations" name="Брони" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bookings" name="Заявки" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Baths */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Популярные бани</h2>
              <p className="text-gray-500 text-sm">Доля в общей выручке за месяц</p>
            </div>
          </div>
          {bathsLoading ? (
            <div className="h-[250px] w-full bg-gray-50 rounded-2xl animate-pulse flex items-center justify-center">
              <span className="text-gray-400 text-sm">Загрузка данных...</span>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="h-[250px] w-full md:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={popularBaths}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="reservation_count"
                    >
                      {popularBaths?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                {popularBaths?.slice(0, 5).map((bath, index) => (
                  <div key={bath.bath_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-sm font-medium text-gray-700">{bath.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{bath.reservation_count} виз.</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-900">Последние действия</h2>
            {user?.is_admin && (
            <NavLink to="/admin/administrator/audit" className="text-sm text-blue-600 hover:underline font-medium">
              Все логи
            </NavLink>
            )}
          </div>
          <div className="space-y-6">
            {recentActivity?.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="mt-1 p-2 bg-gray-50 rounded-xl">
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium truncate">
                    {activity.summary || `${activity.action} ${activity.entity_type}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{formatDateTime(activity.created_at)}</span>
                    {activity.client_name && (
                      <>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="text-xs text-gray-500">{activity.client_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Быстрый доступ</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { to: "/admin/reservations", icon: Calendar, label: "Брони", color: "bg-green-50 text-green-600" },
            { to: "/admin/bookings", icon: MousePointer2, label: "Заявки", color: "bg-orange-50 text-orange-600" },
            { to: "/admin/baths", icon: HomeIcon, label: "Бани", color: "bg-blue-50 text-blue-600" },
            { to: "/admin/storage/nomenclature", icon: Package, label: "Склад", color: "bg-teal-50 text-teal-600" },
            { to: "/admin/documents/entrance", icon: ClipboardList, label: "Документы", color: "bg-purple-50 text-purple-600" },
            user?.is_admin && { to: "/admin/administrator/audit", icon: History, label: "Логи", color: "bg-gray-50 text-gray-600" },
          ].filter(Boolean).map((item, idx) => (
            <NavLink
              key={idx}
              to={item.to}
              className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 group"
            >
              <div className={`p-3 rounded-2xl ${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-gray-700">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
