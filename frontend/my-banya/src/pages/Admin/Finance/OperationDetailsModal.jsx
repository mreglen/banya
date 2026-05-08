import { useGetFinanceOperationDetailQuery } from '../../../redux/slices/apiSlice';

function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function Field({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value || '—'}</p>
    </div>
  );
}

function OperationDetailsModal({ operation, onClose }) {
  const { data, isLoading, error } = useGetFinanceOperationDetailQuery(
    { source: operation.source, id: operation.id },
    { skip: !operation?.source || !operation?.id }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Детали операции</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
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
              <Field label="Тип операции" value={data.operation_type === 'income' ? 'Приход' : 'Расход'} />
              <Field label="Дата" value={new Date(data.date).toLocaleDateString('ru-RU')} />
              <Field label="Сумма" value={formatCurrency(data.amount)} />
              <Field label="Счет" value={data.account_id ?? 'Без счета'} />
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              {data.source === 'entrance' ? (
                <>
                  <h4 className="mb-3 text-sm font-semibold text-gray-900">Детали поступления</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Поставщик" value={data.payload?.supplier_name} />
                    <Field label="Ответственный" value={data.payload?.responsible_name} />
                    <Field label="Номер поставщика" value={data.payload?.supplier_number} />
                    <Field label="Комментарий" value={data.payload?.comment} />
                  </div>
                  <div className="mt-4">
                    <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Позиции</p>
                    {Array.isArray(data.payload?.items) && data.payload.items.length > 0 ? (
                      <div className="space-y-2">
                        {data.payload.items.map((item) => (
                          <div key={item.id || `${item.product_id}-${item.product_name}`} className="rounded-lg border border-gray-200 p-2">
                            <p className="text-sm font-medium text-gray-900">{item.product_name || `Товар #${item.product_id}`}</p>
                            <p className="text-xs text-gray-600">
                              Кол-во: {item.quantity} • Цена закупки: {formatCurrency(item.purchase_price)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Позиции отсутствуют</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h4 className="mb-3 text-sm font-semibold text-gray-900">Детали реализации</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Клиент" value={data.payload?.client_name} />
                    <Field label="Телефон" value={data.payload?.client_phone} />
                    <Field label="Баня" value={data.payload?.bath_name} />
                    <Field label="ID брони" value={data.payload?.reservation_id} />
                  </div>
                  <div className="mt-4">
                    <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Позиции</p>
                    {Array.isArray(data.payload?.items) && data.payload.items.length > 0 ? (
                      <div className="space-y-2">
                        {data.payload.items.map((item) => (
                          <div key={item.id || `${item.product_id}-${item.product_name}`} className="rounded-lg border border-gray-200 p-2">
                            <p className="text-sm font-medium text-gray-900">{item.product_name || `Товар #${item.product_id}`}</p>
                            <p className="text-xs text-gray-600">
                              Кол-во: {item.quantity} • Цена: {formatCurrency(item.price)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Позиции отсутствуют</p>
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
