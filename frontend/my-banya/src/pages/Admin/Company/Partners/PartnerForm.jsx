// src/pages/admin/PartnerForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  useGetPartnerByIdQuery,
  useCreatePartnerMutation,
  useUpdatePartnerMutation,
} from '../../../../redux/slices/apiSlice';
import { toast } from 'react-hot-toast';

function PartnerForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();

  const fromDocument = location.state?.fromDocument;
  const suggestedName = location.state?.partnerName || '';

  

  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    inn: '',
  });

  // RTK Query хуки
  const {  data: partnerData, isLoading: isLoadingData } = useGetPartnerByIdQuery(id, {
    skip: !isEditing,
  }); 

  const [createPartner, { isLoading: isCreating }] = useCreatePartnerMutation();
  const [updatePartner, { isLoading: isUpdating }] = useUpdatePartnerMutation();

  // Загрузка данных при редактировании или подстановка suggestedName
  useEffect(() => {
    if (isEditing && partnerData) {
      setForm({
        name: partnerData.supplier_name || '',
        contactPerson: partnerData.person_name || '',
        inn: partnerData.partner_inn || '',
        phone: partnerData.partner_phone || '',
        email: partnerData.partner_email || '',
      });
    } else if (!isEditing) {
      setForm((prev) => ({
        ...prev,
        name: suggestedName,
      }));
    }
  }, [isEditing, partnerData, suggestedName]);

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
    const { name, contactPerson, phone, email, inn } = form;

    if (!name) {
      toast.error('Введите наименование партнёра');
      return;
    }
    if (!contactPerson) {
      toast.error('Введите ФИО контактного лица');
      return;
    }

    if (inn && !/^\d{10,12}$/.test(inn)) {
      toast.error('ИНН должен содержать 10 или 12 цифр');
      return;
    }

    // Маппинг во входной формат бэкенда
    // Нормализуем телефон
    let normalizedPhone = phone || null;
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
      supplier_name: name,
      person_name: contactPerson,
      partner_inn: inn || null,
      partner_phone: normalizedPhone,
      partner_email: email || null,
    };

    try {
      let newPartner = null;

      if (isEditing) {
        newPartner = await createPartner(payload).unwrap();
      }

      toast.success(isEditing ? 'Партнёр обновлен' : 'Партнёр добавлен');

      // Возврат, если пришли из документа
      if (fromDocument?.returnTo && newPartner) {
        navigate(fromDocument.returnTo, {
          state: { addedPartner: newPartner },
          replace: true,
        });
      } else {
        navigate('/admin/company/partner');
      }
    } catch (err) {
      console.error('Ошибка сохранения:', err);
      toast.error(err.data?.detail || 'Не удалось сохранить партнёра');
    }
  };

  const handleCancel = () => {
    if (fromDocument?.returnTo) {
      navigate(fromDocument.returnTo, { replace: true });
    } else {
      navigate('/admin/company/partner');
    }
  };

  const isLoading = isLoadingData || isCreating || isUpdating;

  if (isLoadingData && isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-600">Загрузка партнёра...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {isEditing ? 'Редактировать партнёра' : 'Добавить нового партнёра'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Наименование *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ИНН
            </label>
            <input
              type="text"
              name="inn"
              value={form.inn}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="10 или 12 цифр"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ФИО (как обращаться) *
            </label>
            <input
              type="text"
              name="contactPerson"
              value={form.contactPerson}
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

export default PartnerForm;