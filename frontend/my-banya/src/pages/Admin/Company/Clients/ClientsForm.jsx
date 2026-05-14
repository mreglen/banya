// src/pages/admin/ClientForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  useGetClientsByIdQuery,
  useCreateClientsMutation,
  useUpdateClientsMutation,
} from '../../../../redux/slices/apiSlice';
import { toast } from 'react-hot-toast';

function ClientForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();

  const fromDocument = location.state?.fromDocument;
  const suggestedName = location.state?.clientName || '';

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    birthDate: '',
  });

  // RTK Query хуки
  const { data: clientData, isLoading: isLoadingData } = useGetClientsByIdQuery(id, {
    skip: !isEditing,
  });

  const [createClient, { isLoading: isCreating }] = useCreateClientsMutation();
  const [updateClient, { isLoading: isUpdating }] = useUpdateClientsMutation();

  // Загрузка данных при редактировании или подстановка suggestedName
  useEffect(() => {
    if (isEditing && clientData) {
      setForm({
        fullName: clientData.full_name || '',
        phone: clientData.phone || '',
        email: clientData.email || '',
        birthDate: clientData.birth_date ? clientData.birth_date.split('T')[0] : '',
      });
    } else if (!isEditing) {
      setForm((prev) => ({
        ...prev,
        fullName: suggestedName,
      }));
    }
  }, [isEditing, clientData, suggestedName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Форматирование номера телефона
    if (name === 'phone') {
      const formatted = formatPhoneInput(value, form.phone);
      setForm((prev) => ({ ...prev, phone: formatted }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Форматирование телефона при вводе: +7 (XXX) XXX-XX-XX
  const formatPhoneInput = (value, prevValue) => {
    // Удаляем все нецифровые символы
    const digits = value.replace(/\D/g, '');
    
    // Если удалили всё
    if (!digits) return '';
    
    // Определяем, удаляет ли пользователь символы
    const isDeleting = value.length < prevValue.length;
    
    // Если удаляем, просто возвращаем значение
    if (isDeleting) return value;
    
    // Ограничиваем 11 цифрами
    const limitedDigits = digits.slice(0, 11);
    
    // Формируем отформатированный номер
    let formatted = '+7';
    
    if (limitedDigits.length > 1) {
      formatted += ' (' + limitedDigits.slice(1, 4);
    }
    if (limitedDigits.length > 4) {
      formatted += ') ' + limitedDigits.slice(4, 7);
    }
    if (limitedDigits.length > 7) {
      formatted += '-' + limitedDigits.slice(7, 9);
    }
    if (limitedDigits.length > 9) {
      formatted += '-' + limitedDigits.slice(9, 11);
    }
    
    return formatted;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fullName, phone, email, birthDate } = form;

    if (!fullName) {
      toast.error('Пожалуйста, заполните ФИО');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Некорректный email');
      return;
    }

    if (birthDate) {
      const birth = new Date(birthDate);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 120);

      if (birth > today) {
        toast.error('Дата рождения не может быть в будущем');
        return;
      }
      if (birth < minDate) {
        toast.error('Некорректная дата рождения');
        return;
      }
    }

    // Маппинг в формат бэкенда
    // Нормализуем телефон: удаляем все символы кроме + и цифр
    let normalizedPhone = null;
    if (phone) {
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length === 11 && phoneDigits.startsWith('7')) {
        normalizedPhone = '+' + phoneDigits;
      } else if (phoneDigits.length === 10) {
        normalizedPhone = '+7' + phoneDigits;
      } else if (phoneDigits.length === 11 && phoneDigits.startsWith('8')) {
        normalizedPhone = '+7' + phoneDigits.slice(1);
      }
    }

    const payload = {
      full_name: fullName,
      phone: normalizedPhone,
      email: email || null,
      birth_date: birthDate || null,
    };

    try {
      let newClient = null;

      if (isEditing) {
        newClient = await createClient(payload).unwrap();
      }

      toast.success(isEditing ? 'Клиент обновлен' : 'Клиент добавлен');

      // Возврат, если пришли из документа
      if (fromDocument?.returnTo && newClient) {
        navigate(fromDocument.returnTo, {
          state: { addedClient: newClient },
          replace: true,
        });
      } else {
        navigate('/admin/company/client');
      }
    } catch (err) {
      console.error('Ошибка сохранения клиента:', err);
      toast.error(err.data?.detail || 'Не удалось сохранить клиента');
    }
  };

  const handleCancel = () => {
    if (fromDocument?.returnTo) {
      navigate(fromDocument.returnTo, { replace: true });
    } else {
      navigate('/admin/company/client');
    }
  };

  const isLoading = isLoadingData || isCreating || isUpdating;

  if (isLoadingData && isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-600">Загрузка клиента...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {isEditing ? 'Редактировать клиента' : 'Добавить нового клиента'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ФИО *
            </label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Номер телефона
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="+7 (999) 123-45-67"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="example@domain.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата рождения
            </label>
            <input
              type="date"
              name="birthDate"
              value={form.birthDate}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-3 rounded-xl font-medium shadow transition ${
                isLoading
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isLoading
                ? 'Сохранение...'
                : isEditing
                ? 'Сохранить изменения'
                : 'Добавить'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-medium shadow transition disabled:opacity-60"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClientForm;