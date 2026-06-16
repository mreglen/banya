import { useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  useGetReservationByIdQuery,
  useGetReservationStatusesQuery,
  useUpdateReservationMutation,
} from '../../../redux/slices/reservationSlice';

const ORG_INFO = {
  name: 'Николаевские бани',
  address: 'г. Екатеринбург, ул. Кизеловская 18',
  phone: '+7 (343) 344-87-55',
  email: 'nikolaevskiebani@yandex.ru',
};

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMoney(value) {
  return `${(value || 0).toLocaleString('ru-RU')} ₽`;
}

function ReservationPrintDocument() {
  const { id } = useParams();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const paymentMode = searchParams.get('payment');
  const advanceRaw = searchParams.get('advance') || '';
  const advanceFromUrl = Number.parseInt(String(advanceRaw).replace(/\D/g, ''), 10) || 0;
  const isQrPayment = paymentMode === 'qrcode';
  const paymentLabel =
    paymentMode === 'qrcode'
      ? 'Оплата по QR коду'
      : paymentMode === 'cash'
        ? 'Наличные'
        : paymentMode === 'advance'
          ? 'Аванс'
          : 'Не указан';
  const { data: reservation, isLoading, error, refetch } = useGetReservationByIdQuery(id, { skip: !id });
  const advanceAmount = advanceFromUrl || reservation?.prepayment || 0;
  const { data: statusOptions = [] } = useGetReservationStatusesQuery();
  const [updateReservation, { isLoading: isConfirmingPayment }] = useUpdateReservationMutation();

  const productTotal = useMemo(
    () => (reservation?.products || []).reduce((sum, p) => sum + (p.price ?? p.purchase_price ?? 0) * (p.quantity || 0), 0),
    [reservation]
  );
  const massagesTotal = useMemo(
    () => (reservation?.massages || []).reduce((sum, m) => sum + (m.cost || 0) * (m.quantity || 0), 0),
    [reservation]
  );
  const extraTotal = productTotal + massagesTotal;
  const totalCost = reservation?.total_cost || 0;
  const bathServiceCost = Math.max(0, totalCost - extraTotal);
  const hasBonusMinutes = Boolean(reservation?.promotion_snapshot?.bonus_minutes);
  const hasGiftProducts = (reservation?.promotion_snapshot?.gift_products || []).length > 0;
  const closedStatus = statusOptions.find(
    (status) => String(status.status_name || '').trim().toLowerCase() === 'закрыт'
  );
  const isAlreadyClosed = String(reservation?.status || '').trim().toLowerCase() === 'закрыт';

  const handleConfirmPayment = async () => {
    if (!reservation?.reservation_id) return;
    if (!closedStatus?.id) {
      setConfirmError('Не найден статус "закрыт".');
      return;
    }
    setConfirmError('');
    try {
      await updateReservation({
        id: reservation.reservation_id,
        status_id: Number(closedStatus.id),
      }).unwrap();
      setIsConfirmModalOpen(false);
      await refetch();
    } catch (e) {
      setConfirmError(e?.data?.detail || 'Не удалось подтвердить оплату.');
    }
  };

  if (isLoading) return <div className="p-6">Загрузка документа...</div>;
  if (error || !reservation) return <div className="p-6 text-red-600">Не удалось загрузить данные брони.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-3 md:p-8">
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .receipt-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
          }
          @page {
            size: 80mm auto;
            margin: 4mm;
          }
        }
      `}</style>

      <div className="max-w-xl mx-auto">
        <div className="no-print mb-4 flex items-center gap-3">
          <button
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={isAlreadyClosed}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={isAlreadyClosed ? 'Бронь уже закрыта' : 'Подтвердить оплату'}
          >
            Подтвердить оплату
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Печать
          </button>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Закрыть вкладку
          </button>
        </div>

        <article className="receipt-sheet w-full max-w-[320px] mx-auto bg-white border border-gray-300 rounded-lg shadow-sm p-4 text-xs text-gray-900">
          <header className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
            <h1 className="text-base font-bold uppercase">{ORG_INFO.name}</h1>
            <p className="mt-1">{ORG_INFO.address}</p>
            <p>{ORG_INFO.phone}</p>
            <p className="mt-2 font-semibold">КАССОВЫЙ ЧЕК</p>
          </header>

          <section className="space-y-1 mb-3">
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Чек</span>
              <span>№ {reservation.reservation_id}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Дата</span>
              <span>{formatDateTime(new Date().toISOString())}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Клиент</span>
              <span className="text-right">{reservation.client_name || '-'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Телефон</span>
              <span>{reservation.client_phone || '-'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Баня</span>
              <span className="text-right">{reservation.bath?.name || '-'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">Период</span>
              <span className="text-right">{formatDateTime(reservation.start_datetime)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-600"></span>
              <span className="text-right">{formatDateTime(reservation.end_datetime)}</span>
            </div>
          </section>

          <section className="mb-3">
            <h2 className="font-semibold border-y border-dashed border-gray-400 py-1 mb-2">Позиции</h2>

            <div className="py-1 border-b border-dashed border-gray-300">
              <div className="font-medium">Услуга бани ({reservation.bath?.name || '-'})</div>
              <div className="flex justify-between text-gray-700">
                <span>1 x {formatMoney(bathServiceCost)}</span>
                <span>{formatMoney(bathServiceCost)}</span>
              </div>
            </div>

            {(reservation.massages || []).map((m, idx) => (
              <div key={`massage-${idx}`} className="py-1 border-b border-dashed border-gray-300">
                <div className="font-medium">Массаж: {m.name}</div>
                <div className="flex justify-between text-gray-700">
                  <span>{m.quantity || 0} x {formatMoney(m.cost || 0)}</span>
                  <span>{formatMoney((m.cost || 0) * (m.quantity || 0))}</span>
                </div>
              </div>
            ))}

            {(reservation.products || []).map((p, idx) => (
              <div key={`product-${idx}`} className="py-1 border-b border-dashed border-gray-300">
                <div className="font-medium">Товар: {p.name}</div>
                <div className="flex justify-between text-gray-700">
                  <span>{p.quantity || 0} x {formatMoney(p.price ?? p.purchase_price ?? 0)}</span>
                  <span>{formatMoney((p.price ?? p.purchase_price ?? 0) * (p.quantity || 0))}</span>
                </div>
              </div>
            ))}
          </section>

          <section className="mb-3 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-700">Гостей</span>
              <span>{reservation.guests || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Статус</span>
              <span>{reservation.status || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Способ оплаты</span>
              <span className="text-right">{paymentLabel}</span>
            </div>
            {paymentMode === 'advance' && (
              <div className="flex justify-between">
                <span className="text-gray-700">Сумма аванса</span>
                <span>{formatMoney(advanceAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-700">Акция</span>
              <span className="text-right">{reservation.promotion_snapshot?.name || 'Нет'}</span>
            </div>
            {hasBonusMinutes && (
              <div className="flex justify-between text-green-700">
                <span>Бонусное время</span>
                <span>+{reservation.promotion_snapshot.bonus_minutes} мин</span>
              </div>
            )}
            {hasGiftProducts && (
              <div className="pt-1">
                <div className="text-green-700 font-medium">Подарки:</div>
                {reservation.promotion_snapshot.gift_products.map((gp, idx) => (
                  <div key={`gift-${idx}`} className="flex justify-between text-green-700">
                    <span>{gp.product_name} x {gp.quantity}</span>
                    <span>0 ₽</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="border-t border-dashed border-gray-400 pt-2">
            <div className="flex justify-between font-bold text-sm">
              <span>ИТОГО К ОПЛАТЕ</span>
              <span>{formatMoney(totalCost)}</span>
            </div>
            {isQrPayment && (
              <div className="mt-4 flex flex-col items-center">
                <div className="h-32 w-32 bg-black" />
              </div>
            )}
            <p className="text-center text-[11px] text-gray-600 mt-3">
              Спасибо за визит!
            </p>
            <p className="text-center text-[11px] text-gray-600">
              {ORG_INFO.email}
            </p>
          </section>
        </article>
      </div>
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900">Подтвердить оплату</h3>
            <p className="mt-2 text-sm text-gray-700">
              После подтверждения оплаты статус брони изменится на <strong>закрыт</strong>.
            </p>
            {confirmError && (
              <p className="mt-2 text-sm text-red-600">{confirmError}</p>
            )}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isConfirmingPayment}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isConfirmingPayment ? 'Подтверждение...' : 'Подтвердить'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setConfirmError('');
                }}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservationPrintDocument;
