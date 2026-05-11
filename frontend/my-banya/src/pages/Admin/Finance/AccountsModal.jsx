import { useState } from 'react';
import {
  useCreateFinanceAccountMutation,
  useDeleteFinanceAccountMutation,
  useGetFinanceAccountsQuery,
  useUpdateFinanceAccountMutation,
} from '../../../redux/slices/apiSlice';

const EMPTY_FORM = {
  bank_name: '',
  account_number: '',
  is_active: true,
};

const formatAccountNumber = (value) => {
  const digits = String(value || '').replace(/\s+/g, '');
  if (!digits) return 'Без номера';
  if (digits.length <= 8) return digits;
  return `${digits.slice(0, 4)} •••• ${digits.slice(-4)}`;
};

function AccountsModal({ onClose }) {
  const { data: accounts = [], isLoading } = useGetFinanceAccountsQuery();
  const [createAccount, { isLoading: isCreating }] = useCreateFinanceAccountMutation();
  const [updateAccount, { isLoading: isUpdating }] = useUpdateFinanceAccountMutation();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteFinanceAccountMutation();

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const isBusy = isCreating || isUpdating || isDeleting;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.bank_name.trim() || !form.account_number.trim()) return;

    if (editingId) {
      await updateAccount({ account_id: editingId, ...form }).unwrap();
    } else {
      await createAccount(form).unwrap();
    }

    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const onEdit = (account) => {
    setEditingId(account.id);
    setForm({
      bank_name: account.bank_name || '',
      account_number: account.account_number || '',
      is_active: !!account.is_active,
    });
  };

  const onDelete = async (accountId) => {
    await deleteAccount(accountId).unwrap();
    if (editingId === accountId) {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Счета организации</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
          >
            Закрыть
          </button>
        </div>

        <form onSubmit={onSubmit} className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-4">
          <input
            type="text"
            value={form.bank_name}
            onChange={(e) => setForm((prev) => ({ ...prev, bank_name: e.target.value }))}
            placeholder="Название банка"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            type="text"
            value={form.account_number}
            onChange={(e) => setForm((prev) => ({ ...prev, account_number: e.target.value }))}
            placeholder="Номер счета"
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            Активен
          </label>
          <button
            type="submit"
            disabled={isBusy}
            className="rounded-lg bg-green-600 px-3 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {editingId ? 'Сохранить' : 'Добавить'}
          </button>
        </form>

        {isLoading ? (
          <p className="text-gray-600">Загрузка счетов...</p>
        ) : (
          <div className="space-y-2">
            {accounts.map((account) => (
              <div key={account.id} className="flex flex-col gap-2 rounded-xl border border-gray-200 p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{account.bank_name}</p>
                  <p className="text-sm text-gray-600">
                    Счет: {formatAccountNumber(account.account_number)}
                  </p>
                  <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    account.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {account.is_active ? 'Активный (используется в бронировании)' : 'Неактивный'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(account)}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onDelete(account.id)}
                    className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
            {!accounts.length && <p className="text-sm text-gray-500">Счета пока не добавлены.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountsModal;
