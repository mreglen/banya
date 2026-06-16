import { useMemo, useState } from 'react';
import {
  useGetFinanceOperationsQuery,
  useGetFinanceSummaryQuery,
} from '../../../redux/slices/apiSlice';
import OperationDetailsModal from './OperationDetailsModal';
import {
  formatFinanceCurrency,
  getOperationListTitle,
  getOperationMeta,
  getOperationSubtitle,
} from './financeHelpers';

const initialFilters = {
  operation_type: 'all',
  period: 'month',
  date_from: '',
  date_to: '',
  skip: 0,
  limit: 50,
};

function Finance() {
  const [filters, setFilters] = useState(initialFilters);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [showHelp, setShowHelp] = useState(true);

  const queryParams = useMemo(() => {
    const params = {
      operation_type: filters.operation_type,
      period: filters.period,
      skip: filters.skip,
      limit: filters.limit,
    };

    if (filters.period === 'custom') {
      params.date_from = filters.date_from || undefined;
      params.date_to = filters.date_to || undefined;
    }
    return params;
  }, [filters]);

  const { data: operationsData, isLoading: operationsLoading } = useGetFinanceOperationsQuery(queryParams);
  const { data: summary, isLoading: summaryLoading } = useGetFinanceSummaryQuery(queryParams);

  const operations = operationsData?.items || [];
  const total = operationsData?.total || 0;

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, skip: 0 }));
  };

  const periodLabel =
    filters.period === 'month'
      ? 'текущий месяц'
      : filters.period === 'all'
        ? 'всё время'
        : 'выбранный период';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Финансы</h1>
        <p className="mt-1 text-sm text-gray-600">
          Движение денег по документам: закрытые брони и закупки товара
        </p>
      </div>

      {showHelp && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="font-semibold">Откуда берутся суммы</p>
              <ul className="list-disc space-y-1 pl-5 text-blue-900">
                <li>
                  <strong className="text-green-700">Приход (+)</strong> — когда бронь переводят в статус{' '}
                  <strong>«закрыт»</strong> (полная сумма брони)
                </li>
                <li>
                  <strong className="text-red-700">Расход (−)</strong> — документ{' '}
                  <strong>поступления</strong> товара на склад (оплата поставщику)
                </li>
                <li>
                  <strong className="text-red-700">Расход (−)</strong> — если закрытую бронь снова открывают
                  (сторно)
                </li>
              </ul>
              <p className="text-xs text-blue-800 pt-1">
                Предоплата и брони со статусом «в ожидании» / «в работе» здесь не учитываются — только
                факт закрытия и закупки.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="shrink-0 text-blue-700 hover:text-blue-900 text-lg leading-none"
              aria-label="Скрыть подсказку"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:grid-cols-4">
        <select
          value={filters.operation_type}
          onChange={(e) => handleFilterChange('operation_type', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        >
          <option value="all">Тип: все операции</option>
          <option value="income">Только приходы (брони)</option>
          <option value="expense">Только расходы (закупки и сторно)</option>
        </select>
        <select
          value={filters.period}
          onChange={(e) => handleFilterChange('period', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        >
          <option value="month">Период: текущий месяц</option>
          <option value="all">Период: за всё время</option>
          <option value="custom">Период: произвольный</option>
        </select>
        {filters.period === 'custom' ? (
          <>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </>
        ) : (
          <button
            type="button"
            onClick={() => setFilters(initialFilters)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">Сводка за: {periodLabel}</p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">Приходы</p>
          <p className="mt-0.5 text-xs text-gray-400">закрытые брони</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {summaryLoading ? '...' : formatFinanceCurrency(summary?.income)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">Расходы</p>
          <p className="mt-0.5 text-xs text-gray-400">закупки + сторно броней</p>
          <p className="mt-1 text-2xl font-bold text-red-600">
            {summaryLoading ? '...' : formatFinanceCurrency(summary?.expense)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">Итог</p>
          <p className="mt-0.5 text-xs text-gray-400">приходы минус расходы</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              (summary?.result || 0) >= 0 ? 'text-gray-900' : 'text-red-600'
            }`}
          >
            {summaryLoading ? '...' : formatFinanceCurrency(summary?.result)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-gray-900">История операций</h2>
          <p className="text-sm text-gray-500">Показано: {operations.length} из {total}</p>
        </div>

        {operationsLoading ? (
          <p className="text-gray-600">Загрузка операций...</p>
        ) : !operations.length ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
            <p className="font-medium text-gray-800">Операций за выбранный период нет</p>
            <p className="mt-2">
              Приход появится после закрытия брони. Расход — после оформления поступления товара в разделе{' '}
              <strong>Документы → Поступление</strong>.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Попробуйте период «за всё время» или фильтр «все операции».
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {operations.map((operation) => {
              const meta = getOperationMeta(operation);
              const isIncome = operation.operation_type === 'income';
              return (
                <button
                  key={`${operation.source}-${operation.id}`}
                  type="button"
                  onClick={() => setSelectedOperation(operation)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:bg-gray-50"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isIncome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {isIncome ? '+' : '−'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${meta.badgeClass}`}
                        >
                          {meta.category}
                        </span>
                        <span
                          className={`text-[11px] font-medium ${isIncome ? 'text-green-700' : 'text-red-700'}`}
                        >
                          {isIncome ? 'Приход' : 'Расход'}
                        </span>
                      </div>
                      <p className="mt-1 font-semibold text-gray-900 truncate">
                        {getOperationListTitle(operation)}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{getOperationSubtitle(operation)}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {new Date(operation.date).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`shrink-0 text-lg font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {isIncome ? '+' : '−'}
                    {formatFinanceCurrency(operation.amount)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedOperation && (
        <OperationDetailsModal
          operation={selectedOperation}
          onClose={() => setSelectedOperation(null)}
        />
      )}
    </div>
  );
}

export default Finance;
