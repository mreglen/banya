import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useGetReservationByIdQuery } from '../../../redux/slices/reservationSlice';

const ORG_INFO = {
  name: 'Николаевские бани',
  address: 'г. Николаевск, ул. Примерная, д. 1',
  phone: '+7 (999) 000-00-00',
  email: 'info@banya.local',
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

function ReservationPrintDocument() {
  const { id } = useParams();
  const { data: reservation, isLoading, error } = useGetReservationByIdQuery(id, { skip: !id });

  const productTotal = useMemo(
    () => (reservation?.products || []).reduce((sum, p) => sum + (p.purchase_price || 0) * (p.quantity || 0), 0),
    [reservation]
  );
  const massagesTotal = useMemo(
    () => (reservation?.massages || []).reduce((sum, m) => sum + (m.cost || 0) * (m.quantity || 0), 0),
    [reservation]
  );
  const extraTotal = productTotal + massagesTotal;
  const totalCost = reservation?.total_cost || 0;
  const bathServiceCost = Math.max(0, totalCost - extraTotal);

  if (isLoading) return <div className="p-6">Загрузка документа...</div>;
  if (error || !reservation) return <div className="p-6 text-red-600">Не удалось загрузить данные брони.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-3 md:p-8">
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <div className="no-print mb-4 flex items-center gap-3">
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

        <article className="print-sheet bg-white border border-gray-300 rounded-lg shadow-sm p-6 md:p-10 text-sm text-gray-900">
          <header className="border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold text-center">АКТ ОКАЗАНИЯ УСЛУГ</h1>
            <p className="text-center mt-1">по бронированию № {reservation.reservation_id}</p>
          </header>

          <section className="mb-5">
            <h2 className="font-semibold mb-2">1. Исполнитель</h2>
            <p>{ORG_INFO.name}</p>
            <p>Адрес: {ORG_INFO.address}</p>
            <p>Телефон: {ORG_INFO.phone} | Email: {ORG_INFO.email}</p>
          </section>

          <section className="mb-5">
            <h2 className="font-semibold mb-2">2. Заказчик</h2>
            <p>ФИО: {reservation.client_name || '-'}</p>
            <p>Телефон: {reservation.client_phone || '-'}</p>
            <p>Email: {reservation.client_email || '-'}</p>
          </section>

          <section className="mb-5">
            <h2 className="font-semibold mb-2">3. Данные бронирования</h2>
            <p>Баня: {reservation.bath?.name || '-'}</p>
            <p>Дата и время: {formatDateTime(reservation.start_datetime)} - {formatDateTime(reservation.end_datetime)}</p>
            <p>Количество гостей: {reservation.guests || 0}</p>
            <p>Статус: {reservation.status || '-'}</p>
          </section>

          <section className="mb-5">
            <h2 className="font-semibold mb-2">4. Перечень услуг и товаров</h2>
            <table className="w-full border border-gray-400 border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-left">Наименование</th>
                  <th className="border border-gray-400 p-2 text-right">Кол-во</th>
                  <th className="border border-gray-400 p-2 text-right">Цена</th>
                  <th className="border border-gray-400 p-2 text-right">Сумма</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-2">Услуга бани ({reservation.bath?.name || '-'})</td>
                  <td className="border border-gray-400 p-2 text-right">1</td>
                  <td className="border border-gray-400 p-2 text-right">{bathServiceCost.toLocaleString('ru-RU')} ₽</td>
                  <td className="border border-gray-400 p-2 text-right">{bathServiceCost.toLocaleString('ru-RU')} ₽</td>
                </tr>
                {(reservation.massages || []).map((m, idx) => (
                  <tr key={`massage-${idx}`}>
                    <td className="border border-gray-400 p-2">Массаж: {m.name}</td>
                    <td className="border border-gray-400 p-2 text-right">{m.quantity}</td>
                    <td className="border border-gray-400 p-2 text-right">{(m.cost || 0).toLocaleString('ru-RU')} ₽</td>
                    <td className="border border-gray-400 p-2 text-right">{((m.cost || 0) * (m.quantity || 0)).toLocaleString('ru-RU')} ₽</td>
                  </tr>
                ))}
                {(reservation.products || []).map((p, idx) => (
                  <tr key={`product-${idx}`}>
                    <td className="border border-gray-400 p-2">Товар: {p.name}</td>
                    <td className="border border-gray-400 p-2 text-right">{p.quantity}</td>
                    <td className="border border-gray-400 p-2 text-right">{(p.purchase_price || 0).toLocaleString('ru-RU')} ₽</td>
                    <td className="border border-gray-400 p-2 text-right">{((p.purchase_price || 0) * (p.quantity || 0)).toLocaleString('ru-RU')} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mb-8">
            <h2 className="font-semibold mb-2">5. Итог</h2>
            <p>Сумма услуг и товаров: {totalCost.toLocaleString('ru-RU')} ₽</p>
            <p>Скидка/акция: {reservation.promotion_snapshot?.name ? reservation.promotion_snapshot.name : 'Не применялась'}</p>
            <p className="font-bold mt-1">Итого к оплате: {totalCost.toLocaleString('ru-RU')} ₽</p>
          </section>

          <section className="pt-6 border-t">
            <div className="grid grid-cols-2 gap-10">
              <div>
                <p className="mb-12">Исполнитель: _____________________</p>
                <p className="text-xs text-gray-500">{ORG_INFO.name}</p>
              </div>
              <div>
                <p className="mb-12">Заказчик: _____________________</p>
                <p className="text-xs text-gray-500">{reservation.client_name || 'Клиент'}</p>
              </div>
            </div>
            <p className="mt-6 text-xs text-gray-500">
              Дата формирования документа: {formatDateTime(new Date().toISOString())}
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}

export default ReservationPrintDocument;
