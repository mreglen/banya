// src/pages/Admin/Documents/DocumentsRealization/DocumentsRealization.jsx

import { useMemo, useState } from 'react';
import { useGetBathsQuery } from '../../../../redux/slices/apiSlice';
import {
  useGetAllReservationsQuery,
  useDeleteReservationMutation,
} from '../../../../redux/slices/reservationSlice';
import AddBookingModal from '../../Reservations/AddBookingModal';
import ActionDropdown from '../../../../components/UI/ActionDropdown/ActionDropdown';
import DocumentsRealizationSkeleton from './DocumentsRealizationSkeleton';

const STATUS_STYLES = {
  'в ожидании': 'bg-amber-50 text-amber-800 border-amber-200',
  'в работе': 'bg-purple-50 text-purple-800 border-purple-200',
  'закрыт': 'bg-rose-50 text-rose-800 border-rose-200',
  'подтверждено': 'bg-sky-50 text-sky-800 border-sky-200',
  'завершено': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'отменено': 'bg-gray-50 text-gray-800 border-gray-200',
};

function getStatusStyle(status) {
  const key = String(status || '').trim().toLowerCase();
  return STATUS_STYLES[key] || 'bg-gray-100 text-gray-800 border-gray-300';
}

function formatLocalYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateTimeRange(startIso, endIso) {
  if (!startIso || !endIso) return '—';
  const start = new Date(startIso);
  const end = new Date(endIso);
  const datePart = start.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeOpts = { hour: '2-digit', minute: '2-digit' };
  return `${datePart}, ${start.toLocaleTimeString('ru-RU', timeOpts)} – ${end.toLocaleTimeString('ru-RU', timeOpts)}`;
}

function formatPrice(price) {
  if (price == null || Number.isNaN(Number(price))) return '—';
  return `${Number(price).toLocaleString('ru-RU')} ₽`;
}

function DocumentsRealization() {
  const {
    data: reservations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllReservationsQuery();

  const { data: baths = [] } = useGetBathsQuery();
  const [deleteReservation] = useDeleteReservationMutation();

  const [editingBooking, setEditingBooking] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    reservation_id: '',
    client_name: '',
    bath_name: '',
    status: '',
  });

  const bathNameById = useMemo(() => {
    const map = new Map();
    baths.forEach((bath) => {
      const id = bath.bath_id ?? bath.id;
      if (id != null) map.set(Number(id), bath.name);
    });
    return map;
  }, [baths]);

  const enrichedReservations = useMemo(
    () =>
      reservations.map((res) => ({
        ...res,
        bath_name: bathNameById.get(Number(res.bath_id)) || '—',
      })),
    [reservations, bathNameById]
  );

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenBooking = (booking) => {
    setEditingBooking(booking);
  };

  const handleCloseBookingModal = () => {
    setEditingBooking(null);
    refetch();
  };

  const handleDelete = async (reservationId) => {
    if (!window.confirm('Удалить бронь? Товары вернутся на склад.')) return;
    try {
      await deleteReservation(reservationId).unwrap();
      refetch();
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('❌ Не удалось удалить бронь');
    }
  };

  const filteredReservations = enrichedReservations.filter((res) => {
    const statusMatch =
      !searchFilters.status ||
      String(res.status || '').toLowerCase().includes(searchFilters.status.toLowerCase());
    return (
      String(res.reservation_id).includes(searchFilters.reservation_id) &&
      (res.client_name || '').toLowerCase().includes(searchFilters.client_name.toLowerCase()) &&
      (res.bath_name || '').toLowerCase().includes(searchFilters.bath_name.toLowerCase()) &&
      statusMatch
    );
  });

  const sortedReservations = [...filteredReservations].sort(
    (a, b) => new Date(b.start_datetime) - new Date(a.start_datetime)
  );

  const selectedDateForModal = editingBooking?.start_datetime
    ? formatLocalYmd(new Date(editingBooking.start_datetime))
    : formatLocalYmd(new Date());

  if (isLoading) {
    return <DocumentsRealizationSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow p-6 border border-red-100">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">Документы реализации</h1>
            <p className="text-red-700 mb-3">Не удалось загрузить брони.</p>
            <p className="text-sm text-gray-600 mb-4">
              {error?.data?.detail || error?.error || 'Проверьте доступность backend API.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
            >
              Повторить
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Документы реализации</h1>
          <p className="text-gray-600 mt-1 md:mt-2">
            Все брони — нажмите на строку, чтобы открыть и отредактировать
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">№ брони</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">ФИО клиента</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Баня</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Дата и время</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Сумма</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Статус</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Действия</th>
              </tr>
              <tr className="bg-white border-b">
                <th className="px-4 py-2">
                  <input
                    type="text"
                    name="reservation_id"
                    value={searchFilters.reservation_id}
                    onChange={handleFilterChange}
                    placeholder="№..."
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-normal"
                  />
                </th>
                <th className="px-4 py-2">
                  <input
                    type="text"
                    name="client_name"
                    value={searchFilters.client_name}
                    onChange={handleFilterChange}
                    placeholder="Клиент..."
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-normal"
                  />
                </th>
                <th className="px-4 py-2">
                  <input
                    type="text"
                    name="bath_name"
                    value={searchFilters.bath_name}
                    onChange={handleFilterChange}
                    placeholder="Баня..."
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-normal"
                  />
                </th>
                <th className="px-4 py-2" />
                <th className="px-4 py-2" />
                <th className="px-4 py-2">
                  <input
                    type="text"
                    name="status"
                    value={searchFilters.status}
                    onChange={handleFilterChange}
                    placeholder="Статус..."
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-normal"
                  />
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedReservations.length > 0 ? (
                sortedReservations.map((res) => (
                  <tr
                    key={res.reservation_id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleOpenBooking(res)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{res.reservation_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{res.client_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{res.bath_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDateTimeRange(res.start_datetime, res.end_datetime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(res.total_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(res.status)}`}
                      >
                        {res.status || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ActionDropdown
                        actions={[
                          {
                            label: 'Открыть бронь',
                            icon: '📋',
                            color: 'blue',
                            onClick: () => handleOpenBooking(res),
                          },
                          {
                            label: 'Удалить',
                            icon: '🗑️',
                            color: 'red',
                            onClick: () => handleDelete(res.reservation_id),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 text-lg">
                    Брони не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {sortedReservations.length > 0 ? (
            sortedReservations.map((res) => (
              <div
                key={res.reservation_id}
                role="button"
                tabIndex={0}
                className="bg-white rounded-xl shadow p-4 border border-gray-100 cursor-pointer"
                onClick={() => handleOpenBooking(res)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenBooking(res);
                  }
                }}
              >
                <div className="font-bold text-gray-900 text-lg mb-1">Бронь #{res.reservation_id}</div>
                <div className="text-sm text-gray-600 mb-2 space-y-1">
                  <div>👤 {res.client_name || '—'}</div>
                  <div>🛁 {res.bath_name || '—'}</div>
                  <div>📅 {formatDateTimeRange(res.start_datetime, res.end_datetime)}</div>
                  <div>💰 {formatPrice(res.total_cost)}</div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(res.status)}`}
                  >
                    {res.status || '—'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(res.reservation_id);
                    }}
                    className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              Брони не найдены.
            </div>
          )}
        </div>

        {editingBooking && (
          <AddBookingModal
            key={editingBooking.reservation_id}
            isOpen
            onClose={handleCloseBookingModal}
            booking={editingBooking}
            selectedDate={selectedDateForModal}
            onEditSuccess={handleCloseBookingModal}
          />
        )}
      </div>
    </div>
  );
}

export default DocumentsRealization;
