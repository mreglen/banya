import { useGetFinanceOperationDetailQuery } from '../../../redux/slices/apiSlice';
import { formatFinanceCurrency, getOperationMeta } from './financeHelpers';

function Field({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value ?? '—'}</p>
    </div>
  );
}

function OperationDetailsModal({ operation, onClose }) {
  const meta = getOperationMeta(operation);
  const { data, isLoading, error } = useGetFinanceOperationDetailQuery(
    { source: operation.source, id: operation.id },
    { skip: !operation?.source || !operation?.id }
  );

  const isIncome = (data?.operation_type || operation.operation_type) === 'income';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.badgeClass}`}>
                {meta.category}
              </span>
              <span
                className={`text-xs font-semibold ${isIncome ? 'text-green-700' : 'text-red-700'}`}
              >
                {isIncome ? 'Приход' : 'Расход'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{meta.detailTitle}</h3>
            <p className="mt-1 text-sm text-gray-500">{meta.hint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 shrink-0"
          >
            Закрыть
          </button>
        </div>

        {isLoading && <p className="text-gray-600">Загрузка...</p>}

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Не удалось загрузить детали операции.
          </p>
        )}

        {data && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:grid-cols-2">
              <Field label="Дата операции" value={new Date(data.date).toLocaleDateString('ru-RU')} />
              <Field
                label="Сумма"
                value={`${isIncome ? '+' : '−'} ${formatFinanceCurrency(data.amount)}`}
              />
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              {data.source === 'entrance' ? (
                <>
                  <h4 className="mb-1 text-sm font-semibold text-gray-900">Документ поступления</h4>
                  <p className="mb-3 text-xs text-gray-500">
                    Деньги ушли поставщику за товар, который оприходовали на склад.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Поставщик" value={data.payload?.supplier_name} />
                    <Field label="Ответственный" value={data.payload?.responsible_name} />
                    <Field label="Номер документа поставщика" value={data.payload?.supplier_number} />
                    <Field label="Комментарий" value={data.payload?.comment} />
                  </div>
                  <div className="mt-4">
                    <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Товары в поступлении</p>
                    {Array.isArray(data.payload?.items) && data.payload.items.length > 0 ? (
                      <div className="space-y-2">
                        {data.payload.items.map((item) => (
                          <div
                            key={item.id || `${item.product_id}-${item.product_name}`}
                            className="rounded-lg border border-gray-200 p-2"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {item.product_name || `Товар #${item.product_id}`}
                            </p>
                            <p className="text-xs text-gray-600">
                              {item.quantity} шт. × {formatFinanceCurrency(item.purchase_price)} ={' '}
                              {formatFinanceCurrency((item.quantity || 0) * (item.purchase_price || 0))}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Позиции не указаны</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h4 className="mb-1 text-sm font-semibold text-gray-900">
                    {data.payload?.is_reversal ? 'Сторно закрытой брони' : 'Оплата по закрытой брони'}
                  </h4>
                  <p className="mb-3 text-xs text-gray-500">
                    {data.payload?.is_reversal
                      ? 'Бронь снова открыли — сумма списана из приходов (отмена закрытия).'
                      : 'Бронь перевели в статус «закрыт» — в приход попала полная сумма брони (баня, гости, товары).'}
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Клиент" value={data.payload?.client_name} />
                    <Field label="Телефон" value={data.payload?.client_phone} />
                    <Field label="Баня" value={data.payload?.bath_name} />
                    <Field label="№ брони" value={data.payload?.reservation_id} />
                  </div>
                  <div className="mt-4">
                    <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                      Товары в брони (если были)
                    </p>
                    {Array.isArray(data.payload?.items) && data.payload.items.length > 0 ? (
                      <div className="space-y-2">
                        {data.payload.items.map((item) => (
                          <div
                            key={item.id || `${item.product_id}-${item.product_name}`}
                            className="rounded-lg border border-gray-200 p-2"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {item.product_name || `Товар #${item.product_id}`}
                            </p>
                            <p className="text-xs text-gray-600">
                              {item.quantity} × {formatFinanceCurrency(item.price)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Только услуга бани — в списке позиций пусто, сумма всё равно включает аренду.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OperationDetailsModal;
