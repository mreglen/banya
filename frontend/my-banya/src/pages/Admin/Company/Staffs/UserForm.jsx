// src/pages/Admin/Company/user/UserForm.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  useGetUserByIdQuery, 
  useCreateUserMutation, 
  useUpdateUserMutation,
  useGetNewPermissionsQuery 
} from '../../../../redux/slices/apiSlice'; 

function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = Boolean(id);
  
  // Получаем текущего пользователя из Redux
  const currentUser = useSelector((state) => state.auth.user);

  const { data: user, isLoading: isLoadingUser } = useGetUserByIdQuery(id ? Number(id) : 0, {
    skip: !isEditing,
  });

  const { data: permissions = [], isLoading: isLoadingPermissions } = useGetNewPermissionsQuery();

  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();

  const [form, setForm] = useState({
    password: '',
    full_name: '',
    phone: '',
    email: '',
    birth_date: '',
    is_admin: false,
    is_director: false,
  });

  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Группировка прав по категориям (исключая 'clients')
  const groupedPermissions = useMemo(() => {
    const grouped = {};
    permissions.forEach(perm => {
      // Скрываем права, связанные с клиентами, но оставляем их в БД
      if (perm.category === 'clients') {
        return;
      }
      if (!grouped[perm.category]) {
        grouped[perm.category] = [];
      }
      grouped[perm.category].push(perm);
    });
    return grouped;
  }, [permissions]);

  // Названия категорий на русском
  const getCategoryName = (category) => {
    const names = {
      reservations: 'Бронирования',
      bookings: 'Заявки с сайта',
      baths: 'Бани',
      storage: 'Склад',
      clients: 'Клиенты',
      partners: 'Партнёры',
      staff: 'Сотрудники',
      documents: 'Документы',
      promotions: 'Акции',
    };
    return names[category] || category;
  };

  // Переключение права
  const togglePermission = (permissionId, checked) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  // Загрузка данных при редактировании
  useEffect(() => {
    if (isEditing && user) {
      setForm({
        password: '', // не возвращается с бэка
        full_name: user.full_name || '',
        phone: user.phone || '',
        email: user.email || '',
        birth_date: user.birth_date ? user.birth_date.split('T')[0] : '',
        is_admin: user.is_admin || false,
        is_director: user.is_director || false,
      });
      // Установка выбранных прав
      if (user.permissions && user.permissions.length > 0) {
        setSelectedPermissions(user.permissions.map(p => p.id));
      }
    }
  }, [isEditing, user]);

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
    const { password, full_name, phone, email, birth_date } = form;

    if (!full_name || !email || !phone) {
      alert('Пожалуйста, заполните обязательные поля: ФИО, email и телефон.');
      return;
    }

    if (!isEditing && !password) {
      alert('Пароль обязателен при создании нового пользователя.');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Некорректный email.');
      return;
    }

    if (birth_date) {
      const birth = new Date(birth_date);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 120);

      if (birth > today) {
        alert('Дата рождения не может быть в будущем.');
        return;
      }
      if (birth < minDate) {
        alert('Некорректная дата рождения.');
        return;
      }
    }

    try {
      // Нормализуем телефон перед отправкой
      let normalizedPhone = phone;
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

      if (isEditing) {
        // Не отправляем пароль, если он пустой
        const payload = { 
          ...form,
          phone: normalizedPhone,
          permission_ids: selectedPermissions,
        };
        if (!payload.password) delete payload.password;
        console.log('📤 Updating user payload:', payload);
        await updateUser({ user_id: Number(id), ...payload }).unwrap();
      } else {
        const payload = {
          ...form,
          phone: normalizedPhone,
          permission_ids: selectedPermissions,
        };
        console.log('📤 Creating user payload:', payload);
        await createUser(payload).unwrap();
        const returnTo = location.state?.fromDocument?.returnTo;
        if (returnTo) {
          navigate(returnTo, { state: { addedUser: form } });
          return;
        }
      }
      navigate('/admin/company/user');
    } catch (err) {
      console.error('❌ Ошибка сохранения:', err);
      console.error('📥 Error details:', err.data || err.error || err.message);
      const errorMessage = err.data?.detail || err.error || 'Не удалось сохранить пользователя. Проверьте данные и повторите попытку.';
      alert(errorMessage);
    }
  };

  const isLoading = (isEditing && isLoadingUser) || isLoadingPermissions;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {isEditing ? 'Редактировать пользователя' : 'Добавить нового пользователя'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Телефон *
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="+7 (999) 123-45-67"
              required
            />
          </div>

          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  required={!isEditing}
                  placeholder="Введите пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Показываем только администраторам системы */}
          {currentUser?.is_admin && (
            <>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_admin"
                  name="is_admin"
                  checked={form.is_admin}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_admin: e.target.checked }))}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="is_admin" className="ml-2 text-sm font-medium text-gray-700">
                  Администратор системы
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_director"
                  name="is_director"
                  checked={form.is_director}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_director: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_director" className="ml-2 text-sm font-medium text-gray-700">
                  Директор компании
                </label>
              </div>
            </>
          )}

          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Новый пароль (оставьте пустым, чтобы не менять)
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showNewPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ФИО *
            </label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата рождения
            </label>
            <input
              type="date"
              name="birth_date"
              value={form.birth_date}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Выбор прав доступа - кнопка для открытия модалки */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Права доступа
            </label>
            <button
              type="button"
              onClick={() => setShowPermissionsModal(true)}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition group cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-green-700 transition">
                    Выберите права доступа
                  </span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              {selectedPermissions.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Выбрано прав: {selectedPermissions.length}
                </div>
              )}
            </button>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium shadow transition"
            >
              {isEditing ? 'Сохранить изменения' : 'Добавить'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/company/user')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-xl font-medium shadow transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>

      {/* Модалка выбора прав доступа */}
      {showPermissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Права доступа</h2>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h4 className="font-semibold text-gray-800 mb-3 text-base">
                    {getCategoryName(category)}
                  </h4>
                  <div className="space-y-2 ml-4">
                    {perms.map(permission => (
                      <label key={permission.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={(e) => togglePermission(permission.id, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm text-gray-700 font-medium">{permission.name}</span>
                          {permission.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{permission.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {permissions.length === 0 && (
                <p className="text-gray-500 text-center py-8">Права доступа не загружены</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserForm;