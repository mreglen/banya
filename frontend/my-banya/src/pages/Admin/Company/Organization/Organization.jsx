import { useEffect, useState } from 'react';
import {
  useAdminGetOrganizationQuery,
  useAdminUpdateOrganizationMutation,
} from '../../../../redux/slices/apiSlice';

function Organization() {
  const { data, isLoading, isError, refetch } = useAdminGetOrganizationQuery();
  const [updateOrg, { isLoading: isSaving }] = useAdminUpdateOrganizationMutation();

  const [form, setForm] = useState({
    address: '',
    inn: '',
    kpp: '',
    requisites: '',
  });

  const [message, setMessage] = useState(null);

  const errorToText = (err) => {
    const detail = err?.data?.detail;
    if (!detail) return 'Не удалось сохранить';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const first = detail[0];
      if (typeof first === 'string') return first;
      if (first?.msg) return String(first.msg);
      return JSON.stringify(detail);
    }
    if (detail?.msg) return String(detail.msg);
    try {
      return JSON.stringify(detail);
    } catch {
      return 'Не удалось сохранить';
    }
  };

  useEffect(() => {
    if (!data) return;
    setForm({
      address: data.address || '',
      inn: data.inn || '',
      kpp: data.kpp || '',
      requisites: data.requisites || '',
    });
  }, [data]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === 'inn') {
      const digits = String(value || '').replace(/\D/g, '').slice(0, 12);
      setForm((prev) => ({ ...prev, inn: digits }));
      return;
    }
    if (name === 'kpp') {
      const digits = String(value || '').replace(/\D/g, '').slice(0, 9);
      setForm((prev) => ({ ...prev, kpp: digits }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await updateOrg({
        address: form.address,
        inn: form.inn,
        kpp: form.kpp,
        requisites: form.requisites,
      }).unwrap();
      setMessage({ type: 'success', text: 'Сохранено' });
      refetch();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: errorToText(err) });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Загрузка...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-red-600 text-lg">Ошибка загрузки. Попробуйте позже.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Организация</h1>
            <p className="text-gray-600 mt-1">Реквизиты и адрес для отображения на сайте</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
          {message && (
            <div
              className={`mb-4 rounded-xl px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={onSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Адрес</label>
              <textarea
                name="address"
                value={form.address}
                onChange={onChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-green-500"
                placeholder="г. Екатеринбург, ул. ..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ИНН</label>
                <input
                  name="inn"
                  value={form.inn}
                  onChange={onChange}
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="10 или 12 цифр"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Только цифры. Длина 10 или 12.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">КПП</label>
                <input
                  name="kpp"
                  value={form.kpp}
                  onChange={onChange}
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="9 цифр"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Только цифры. Длина 9.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Реквизиты</label>
              <textarea
                name="requisites"
                value={form.requisites}
                onChange={onChange}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-green-500"
                placeholder="Название организации, р/с, к/с, БИК, банк и т.д."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className={`px-5 py-3 rounded-xl font-medium transition ${
                  isSaving ? 'bg-gray-200 text-gray-600' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Organization;

