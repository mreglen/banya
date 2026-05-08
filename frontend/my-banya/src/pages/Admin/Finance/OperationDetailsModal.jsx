import { useGetFinanceOperationDetailQuery } from '../../../redux/slices/apiSlice';

function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
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
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Тип</p>
                <p className="font-semibold text-gray-900">
                  {data.operation_type === 'income' ? 'Приход' : 'Расход'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Дата</p>
                <p className="font-semibold text-gray-900">{new Date(data.date).toLocaleDateString('ru-RU')}</p>
              </div>
              <div>
                <p className="text-gray-500">Сумма</p>
                <p className="font-semibold text-gray-900">{formatCurrency(data.amount)}</p>
              </div>
              <div>
                <p className="text-gray-500">Счет</p>
                <p className="font-semibold text-gray-900">{data.account_id ?? 'Без счета'}</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-3">
              <p className="mb-2 text-sm font-semibold text-gray-900">Информация</p>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs text-gray-700">
                {JSON.stringify(data.payload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OperationDetailsModal;
