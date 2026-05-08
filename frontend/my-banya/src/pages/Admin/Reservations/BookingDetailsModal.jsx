// src/pages/Admin/Reservations/BookingDetailsModal.jsx

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetBathsQuery, useGetFinanceAccountsQuery } from '../../../redux/slices/apiSlice';
import { useGetUnitsOfMeasurementQuery } from '../../../redux/slices/productsApiSlice';
import { useGetReservationStatusesQuery, useUpdateReservationMutation, reservationApiSlice } from '../../../redux/slices/reservationSlice';
import AddBookingModal from './AddBookingModal';

const formatLocalYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function BookingDetailsModal({ booking, onClose, onDelete }) {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth?.user);
  const [isEditing, setIsEditing] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [accountError, setAccountError] = useState(null);
  
  const { data: baths = [] } = useGetBathsQuery();
  const { data: financeAccounts = [] } = useGetFinanceAccountsQuery({ active_only: true });
  const { data: units = [] } = useGetUnitsOfMeasurementQuery();
  const { data: statusOptions = [] } = useGetReservationStatusesQuery();
  const [updateReservation] = useUpdateReservationMutation();
  const permissionCodes = new Set((currentUser?.permissions || []).map((p) => p.code));
  const canManageReservation = Boolean(
    currentUser?.is_admin ||
    currentUser?.is_director ||
    permissionCodes.has('reservations:manage')
  );

  // Сброс режима при смене брони
  useEffect(() => {
    setIsEditing(false);
    setIsNotesExpanded(false);
    setStatusError(null);
    setAccountError(null);
  }, [booking]);

  // Устанавливаем текущий статус при загрузке статусов
  useEffect(() => {
    if (booking && statusOptions.length > 0) {
      const currentStatus = statusOptions.find(s => s.status_name === booking.status);
      setSelectedStatusId(currentStatus ? currentStatus.id : null);
    }
  }, [booking, statusOptions]);

  useEffect(() => {
    if (!booking) return;
    setSelectedAccountId(booking.income_account_id ? String(booking.income_account_id) : '');
  }, [booking]);

  if (!booking) return null;

  const bath = baths.find((b) => String(b.bath_id) === String(booking.bath_id));
  const bathName = bath?.name || 'Баня не найдена';

  // Определяем цену бани на основе дня недели
  const getBathPrice = () => {
    if (!bath) return 0;
    const startDate = new Date(booking.start_datetime);
    const weekday = startDate.getDay(); // 0=воскресенье, 1=понедельник, ..., 6=суббота
    // Преобразуем: 0(вс)→6, 1(пн)→0, 2(вт)→1, ..., 6(сб)→5
    const jsWeekday = weekday === 0 ? 6 : weekday - 1;
    // пн=0, вт=1, ср=2, чт=3 → будни; пт=4, сб=5, вс=6 → выходные
    return jsWeekday >= 4 ? bath.cost_weekend : bath.cost_weekday;
  };

  const bathPrice = getBathPrice();

  const getUnitName = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    return unit?.description || unit?.name || 'шт';
  };

  // 🧮 Рассчитываем стоимость услуг
  const broomsTotal = (booking.brooms || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const menuItemsTotal = (booking.menu_items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const massagesTotal = (booking.massages || []).reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  const totalCostNum = Number(booking.total_cost);
  const bathOnlyCost = Number.isFinite(totalCostNum)
    ? totalCostNum - broomsTotal - menuItemsTotal - massagesTotal
    : 0;

  // 🔁 Переключиться обратно к просмотру
  const handleBackToView = () => {
    setIsEditing(false);
  };

  // ✅ После успешного редактирования — закрыть всё
  const handleEditSuccess = () => {
    onClose(); // или можно обновить данные и остаться в просмотре
  };

  // Бронь закрыта и пользователь не имеет прав для отката статуса
  const isClosed = booking.status === 'закрыт';
  const canRevertClosed = !!(currentUser?.is_admin || currentUser?.is_director);
  const lockStatus = isClosed && !canRevertClosed;

  // 💾 Обработка изменения статуса с cache invalidation
  const handleStatusChange = async (e) => {
    const newStatusId = parseInt(e.target.value, 10);
    setSelectedStatusId(newStatusId);
    setStatusError(null);
    
    try {
      setIsSavingStatus(true);
      await updateReservation({
        id: booking.reservation_id,
        status_id: newStatusId
      }).unwrap();
      
      // ✅ Invalidate cache to refresh parent list
      dispatch(reservationApiSlice.util.invalidateTags(['Reservations']));
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      // Возвращаем предыдущий статус при ошибке
      const currentStatus = statusOptions.find(s => s.status_name === booking.status);
      setSelectedStatusId(currentStatus ? currentStatus.id : null);

      const httpStatus = error?.status ?? error?.originalStatus;
      const detail = error?.data?.detail;
      if (httpStatus === 403) {
        setStatusError(
          typeof detail === 'string' && detail
            ? detail
            : 'Только администратор или директор может вернуть закрытую бронь в работу'
        );
      } else if (typeof detail === 'string' && detail) {
        setStatusError(detail);
      } else {
        setStatusError('Не удалось обновить статус. Попробуйте ещё раз.');
      }
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleAccountChange = async (e) => {
    const newAccountId = e.target.value;
    setSelectedAccountId(newAccountId);
    setAccountError(null);

    try {
      setIsSavingAccount(true);
      await updateReservation({
        id: booking.reservation_id,
        income_account_id: newAccountId ? parseInt(newAccountId, 10) : null,
      }).unwrap();

      dispatch(reservationApiSlice.util.invalidateTags(['Reservations']));
    } catch (error) {
      console.error('Ошибка обновления счета зачисления:', error);
      setSelectedAccountId(booking.income_account_id ? String(booking.income_account_id) : '');

      const detail = error?.data?.detail;
      if (typeof detail === 'string' && detail) {
        setAccountError(detail);
      } else {
        setAccountError('Не удалось обновить счет зачисления. Попробуйте еще раз.');
      }
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handlePrint = () => {
    window.open(`/admin/reservations/print/${booking.reservation_id}`, '_blank', 'noopener,noreferrer');
  };

  if (isEditing) {
    return (
      <AddBookingModal
        isOpen={true}
        // 🔁 Закрытие = возврат к просмотру, а не полное закрытие
        onClose={handleBackToView}
        booking={booking}
        selectedDate={formatLocalYmd(new Date(booking.start_datetime))}
        // Опционально: передать колбэк на успех
        onEditSuccess={handleEditSuccess}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-0 sm:p-4 z-50">
      <div
        className="bg-white rounded-none sm:rounded-xl shadow-2xl w-full max-w-4xl h-[100dvh] sm:h-[95vh] flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0 relative">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Детали брони</h2>
          <button
            onClick={onClose}
            className="absolute top-3 right-4 sm:top-6 sm:right-6 text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4 text-sm">
            <div><strong>Клиент:</strong> {booking.client_name}</div>
            <div><strong>Роль сотрудника:</strong> {currentUser?.role_rel?.name || 'Без роли'}</div>
            <div><strong>Телефон:</strong> {booking.client_phone}</div>
            {booking.client_email && <div><strong>Email:</strong> {booking.client_email}</div>}
            <div><strong>Баня:</strong> {bathName}</div>
            <div><strong>Гостей:</strong> {booking.guests}</div>
            <div>
              <strong>Время:</strong>{' '}
              {new Date(booking.start_datetime).toLocaleString('ru-RU', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit' 
              })} —{' '}
              {new Date(booking.end_datetime).toLocaleString('ru-RU', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            
            {/* Комментарии с кнопкой "Читать дальше" */}
            {booking.notes && (
              <div className="w-full">
                <strong>Комментарий:</strong>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {booking.notes.length > 200 && !isNotesExpanded ? (
                    <>
                      <p className="text-gray-700 break-words">
                        {booking.notes.substring(0, 200)}...
                      </p>
                      <button
                        onClick={() => setIsNotesExpanded(true)}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      >
                        Читать дальше →
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-700 break-words whitespace-pre-wrap">
                        {booking.notes}
                      </p>
                      {booking.notes.length > 200 && isNotesExpanded && (
                        <button
                          onClick={() => setIsNotesExpanded(false)}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        >
                          ← Свернуть
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <strong>Статус:</strong>
                <select
                  value={selectedStatusId || ''}
                  onChange={handleStatusChange}
                  disabled={isSavingStatus || lockStatus || !canManageReservation}
                  title={
                    lockStatus
                      ? 'Изменить статус закрытой брони может только администратор или директор'
                      : (!canManageReservation ? 'Недостаточно прав для изменения статуса' : undefined)
                  }
                  className={`w-full sm:w-auto sm:min-w-[220px] px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    isSavingStatus || lockStatus
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer'
                  }`}
                >
                  {statusOptions.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.status_name}
                    </option>
                  ))}
                </select>
                {isSavingStatus && (
                  <span className="ml-2 text-xs text-gray-500">Сохранение...</span>
                )}
              </div>
              {lockStatus && (
                <p className="text-xs text-gray-500">
                  Бронь закрыта. Изменить статус может только администратор или директор.
                </p>
              )}
              {statusError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {statusError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <strong>Счет зачисления:</strong>
                <select
                  value={selectedAccountId}
                  onChange={handleAccountChange}
                  disabled={isSavingAccount || !canManageReservation}
                  title={!canManageReservation ? 'Недостаточно прав для изменения счета зачисления' : undefined}
                  className={`w-full sm:w-auto sm:min-w-[280px] px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    isSavingAccount || !canManageReservation
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer'
                  }`}
                >
                  <option value="">Без счета</option>
                  {financeAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bank_name} ({account.account_number})
                    </option>
                  ))}
                </select>
                {isSavingAccount && (
                  <span className="ml-2 text-xs text-gray-500">Сохранение...</span>
                )}
              </div>
              {accountError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span> {accountError}
                </p>
              )}
            </div>
            
            {/* 🎉 Примененная акция */}
            {booking.promotion_snapshot && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <span className="text-xl">🎉</span>
                  Примененная акция
                </h4>
                <div className="text-sm space-y-2">
                  <div><strong>Название:</strong> {booking.promotion_snapshot.name}</div>
                  {booking.promotion_snapshot.description && (
                    <div><strong>Описание:</strong> {booking.promotion_snapshot.description}</div>
                  )}
                  
                  {/* Условия */}
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <strong>Условия:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-gray-700">
                      {booking.promotion_snapshot.min_hours && (
                        <li>При заказе от {booking.promotion_snapshot.min_hours} часов</li>
                      )}
                      {booking.promotion_snapshot.min_guests && (
                        <li>При заказе от {booking.promotion_snapshot.min_guests} гостей</li>
                      )}
                    </ul>
                  </div>
                  
                  {/* Бонусы */}
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <strong>Бонусы:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-gray-700">
                      {booking.promotion_snapshot.bonus_minutes && (
                        <li className="text-green-700 font-medium">
                          +{booking.promotion_snapshot.bonus_minutes} минут дополнительно
                        </li>
                      )}
                      {booking.promotion_snapshot.gift_products?.map((gp, idx) => (
                        <li key={idx} className="text-green-700">
                          Подарок: {gp.product_name} × {gp.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 💰 Чек */}
          <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-4">Чек</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Баня ({bathName}):</span>
              <strong>{bathOnlyCost.toLocaleString()} ₽</strong>
            </div>
            {booking.guests > bath?.base_guests && (
              <div className="flex justify-between text-gray-600 pl-4">
                <span>
                  Доп. гости ({booking.guests - bath.base_guests} × {bath.extra_guest_price} ₽):
                </span>
                <span>
                  {((booking.guests - bath.base_guests) * bath.extra_guest_price).toLocaleString()} ₽
                </span>
              </div>
            )}
            {bath && (
              <div className="flex justify-between text-gray-600 pl-4 text-xs">
                <span>
                  {(() => {
                    const startDate = new Date(booking.start_datetime);
                    const weekday = startDate.getDay();
                    const jsWeekday = weekday === 0 ? 6 : weekday - 1;
                    return jsWeekday >= 4 ? 'Цена выходного дня' : 'Цена буднего дня';
                  })()}
                  {' '}( {bathPrice} ₽/час ):
                </span>
              </div>
            )}

            {booking.massages?.length > 0 && (
              <>
                <div className="pt-2 border-t border-gray-200 mt-2"><span className="font-medium">Массажи:</span></div>
                {booking.massages.map((massage, idx) => (
                  <div key={idx} className="flex justify-between pl-4 text-gray-600">
                    <span>{massage.name} × {massage.quantity}</span>
                    <span>{(massage.cost * massage.quantity).toLocaleString()} ₽</span>
                  </div>
                ))}
              </>
            )}


            {booking.products?.length > 0 && (
              <>
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <span className="font-medium">Товары:</span>
                </div>
                <div className="pl-0 sm:pl-4 space-y-2">
                  <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 pb-1">
                    <div className="col-span-4">Название</div>
                    <div className="col-span-2">Размер</div>
                    <div className="col-span-2 text-right">Цена за шт</div>
                    <div className="col-span-2 text-right">Кол-во</div>
                    <div className="col-span-2 text-right">Итого</div>
                  </div>
                  {booking.products.map((product, idx) => (
                    <div key={idx}>
                      <div className="sm:hidden rounded-lg border border-gray-200 bg-white p-2 text-sm">
                        <div className="font-medium text-gray-800">{product.name}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {product.quantity} {getUnitName(product.unit_id)} x {(product.price ?? product.purchase_price ?? 0).toLocaleString()} ₽
                        </div>
                        <div className="text-right font-semibold mt-1">
                          {((product.price ?? product.purchase_price ?? 0) * product.quantity).toLocaleString()} ₽
                        </div>
                      </div>
                      <div className="hidden sm:grid grid-cols-12 gap-2 text-sm">
                        <div className="col-span-4 text-gray-700">{product.name}</div>
                        <div className="col-span-2 text-gray-600">{getUnitName(product.unit_id)}</div>
                        <div className="col-span-2 text-right text-gray-600">{(product.price ?? product.purchase_price ?? 0).toLocaleString()} ₽</div>
                        <div className="col-span-2 text-right text-gray-600">{product.quantity}</div>
                        <div className="col-span-2 text-right font-medium">{((product.price ?? product.purchase_price ?? 0) * product.quantity).toLocaleString()} ₽</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}


            <hr className="my-3 border-gray-300" />
            
            {/* Показываем бонусное время в чеке */}
            {booking.promotion_snapshot?.bonus_minutes && (
              <div className="flex justify-between text-green-700 font-medium mt-2">
                <span>Бонусное время (акция):</span>
                <span>+{booking.promotion_snapshot.bonus_minutes} мин</span>
              </div>
            )}
            
            {/* Показываем подарки в чеке */}
            {booking.promotion_snapshot?.gift_products?.length > 0 && (
              <>
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <span className="font-medium text-green-700">Подарки (акция):</span>
                </div>
                {booking.promotion_snapshot.gift_products.map((gp, idx) => (
                  <div key={idx} className="flex justify-between pl-4 text-green-700">
                    <span>{gp.product_name} × {gp.quantity}</span>
                    <span>Бесплатно</span>
                  </div>
                ))}
              </>
            )}
            
            <div className="flex justify-between font-bold text-lg">
              <span>Итого к оплате:</span>
              <span className="text-green-600">
                {(Number.isFinite(totalCostNum) ? totalCostNum : 0).toLocaleString()} ₽
              </span>
            </div>
          </div>
          </div>
        </div>

        {/* Footer - Buttons */}
        <div
          className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 flex-shrink-0"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={handlePrint}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            Печать
          </button>
          <button
            onClick={() => setIsEditing(true)}
            disabled={!canManageReservation}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canManageReservation ? 'Недостаточно прав для редактирования брони' : undefined}
          >
            Редактировать
          </button>
          <button
            onClick={() => {
              if (!canManageReservation) return;
              if (window.confirm('Удалить бронь?')) {
                onDelete(booking.reservation_id);
                onClose(); // закрыть после удаления
              }
            }}
            disabled={!canManageReservation}
            className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canManageReservation ? 'Недостаточно прав для удаления брони' : undefined}
          >
            Удалить
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingDetailsModal;