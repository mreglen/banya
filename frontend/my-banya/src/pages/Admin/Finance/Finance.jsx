import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetFinanceAccountsQuery,
  useGetFinanceOperationsQuery,
  useGetFinanceSummaryQuery,
} from '../../../redux/slices/apiSlice';
import OperationDetailsModal from './OperationDetailsModal';
import AccountsModal from './AccountsModal';

const initialFilters = {
  operation_type: 'all',
  period: 'month',
  account_id: '',
  date_from: '',
  date_to: '',
  skip: 0,
  limit: 50,
};

function formatCurrency(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function Finance() {
  const { user } = useSelector((state) => state.auth);
  const canManageAccounts = !!(user?.is_admin || user?.is_director);

  const [filters, setFilters] = useState(initialFilters);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [showAccountsModal, setShowAccountsModal] = useState(false);

  const queryParams = useMemo(() => {
    const params = {
      operation_type: filters.operation_type,
      period: filters.period,
      account_id: filters.account_id === '' ? undefined : Number(filters.account_id),
      skip: filters.skip,
      limit: filters.limit,
    };

    if (filters.period === 'custom') {
      params.date_from = filters.date_from || undefined;
      params.date_to = filters.date_to || undefined;
    }
    return params;
  }, [filters]);

  const { data: accounts = [] } = useGetFinanceAccountsQuery();
  const { data: operationsData, isLoading: operationsLoading } = useGetFinanceOperationsQuery(queryParams);
  const { data: summary, isLoading: summaryLoading } = useGetFinanceSummaryQuery(queryParams);

  const operations = operationsData?.items || [];
  const total = operationsData?.total || 0;

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, skip: 0 }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Финансы</h1>
        {canManageAccounts && (
          <button
            type="button"
            onClick={() => setShowAccountsModal(true)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Счета организации
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:grid-cols-5">
        <select
          value={filters.operation_type}
          onChange={(e) => handleFilterChange('operation_type', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        >
          <option value="all">Тип операции: Все</option>
          <option value="income">Только приходы</option>
          <option value="expense">Только расходы</option>
        </select>
        <select
          value={filters.period}
          onChange={(e) => handleFilterChange('period', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        >
          <option value="month">Период: Текущий месяц</option>
          <option value="all">Период: За все время</option>
          <option value="custom">Период: Произвольный</option>
        </select>
        <select
          value={filters.account_id}
          onChange={(e) => handleFilterChange('account_id', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        >
          <option value="">Счет: Все</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.bank_name} ({account.account_number})
            </option>
          ))}
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">Приходы</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {summaryLoading ? '...' : formatCurrency(summary?.income)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">Расходы</p>
          <p className="mt-1 text-2xl font-bold text-red-600">
            {summaryLoading ? '...' : formatCurrency(summary?.expense)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500">Итог</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {summaryLoading ? '...' : formatCurrency(summary?.result)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">История операций</h2>
          <p className="text-sm text-gray-500">Всего: {total}</p>
        </div>

        {operationsLoading ? (
          <p className="text-gray-600">Загрузка операций...</p>
        ) : !operations.length ? (
          <p className="text-gray-500">Операции не найдены.</p>
        ) : (
          <div className="space-y-2">
            {operations.map((operation) => (
              <button
                key={`${operation.source}-${operation.id}`}
                type="button"
                onClick={() => setSelectedOperation(operation)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-3 text-left transition hover:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    operation.operation_type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {operation.operation_type === 'income' ? '+' : '-'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{operation.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(operation.date).toLocaleDateString('ru-RU')}
                      {operation.subtitle ? ` • ${operation.subtitle}` : ''}
                    </p>
                  </div>
                </div>
                <p className={`text-lg font-bold ${operation.operation_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {operation.operation_type === 'income' ? '+' : '-'}
                  {formatCurrency(operation.amount)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedOperation && (
        <OperationDetailsModal
          operation={selectedOperation}
          onClose={() => setSelectedOperation(null)}
        />
      )}

      {showAccountsModal && canManageAccounts && (
        <AccountsModal onClose={() => setShowAccountsModal(false)} />
      )}
    </div>
  );
}

export default Finance;
