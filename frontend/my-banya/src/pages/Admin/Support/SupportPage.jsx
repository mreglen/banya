import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetAllTicketsQuery, useGetMyTicketsQuery } from '../../../redux/supportApiSlice';
import TicketCard from './components/TicketCard';

function SupportPage() {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.is_admin;
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка данных в зависимости от роли
  const {
    data: adminTickets,
    isLoading: isLoadingAdmin,
    error: adminError,
  } = useGetAllTicketsQuery(statusFilter !== 'all' ? statusFilter : undefined, {
    skip: !isAdmin,
  });

  const {
    data: userTickets,
    isLoading: isLoadingUser,
    error: userError,
  } = useGetMyTicketsQuery({}, {
    skip: isAdmin,
  });

  const tickets = isAdmin ? adminTickets : userTickets;
  const isLoading = isAdmin ? isLoadingAdmin : isLoadingUser;
  const error = isAdmin ? adminError : userError;

  // Фильтрация по поиску
  const filteredTickets = tickets?.filter((ticket) =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Ошибка загрузки</h2>
          <p className="text-gray-600">Не удалось загрузить обращения</p>
        </div>
      </div>
    );
  }

  // Админка - список всех обращений
  if (isAdmin) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Поддержка</h1>
          <p className="text-gray-600 mt-2">Управление обращениями пользователей</p>
        </div>

        {/* Фильтры */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Поиск */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск по заголовку..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Фильтр по статусу */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                В обработке
              </button>
              <button
                onClick={() => setStatusFilter('closed')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === 'closed'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Закрытые
              </button>
            </div>
          </div>
        </div>

        {/* Список обращений */}
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5m-16 0a2 2 0 002 2h12a2 2 0 002-2m-4 0h-8m-4-9h8"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Обращений не найдено
            </h3>
            <p className="text-gray-600">
              {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Пока нет обращений в поддержку'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} isAdmin={true} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Пользователь - свои обращения
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Поддержка</h1>
          <p className="text-gray-600 mt-2">Ваши обращения в службу поддержки</p>
        </div>
        <Link
          to="/admin/support/create"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Создать обращение
        </Link>
      </div>

      {/* Приветственное сообщение, если нет обращений */}
      {(!userTickets || userTickets.length === 0) && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 mb-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Добро пожаловать в чат поддержки!</h2>
              <p className="text-indigo-100 leading-relaxed">
                Опишите вашу проблему, и мы ответим вам в ближайшее время.
                Создайте обращение, указав заголовок и подробное описание проблемы.
                Вы также можете прикрепить фотографии для наглядности.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Список обращений */}
      {userTickets && userTickets.length > 0 && (
        <div className="space-y-4">
          {userTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} isAdmin={false} />
          ))}
        </div>
      )}
    </div>
  );
}

export default SupportPage;
