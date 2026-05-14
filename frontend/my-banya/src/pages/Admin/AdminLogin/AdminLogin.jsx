// src/pages/Admin/AdminLogin/AdminLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../../redux/slices/authSlice';
import { login, getProfile } from '../../../redux/slices/adminApi'; // ← getProfile
import { toast } from 'react-hot-toast';

function AdminLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({ emailOrPhone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('\n=== LOGIN ATTEMPT ===');
      console.log('Email/Phone:', formData.emailOrPhone);
      
      // Always use login-with-remember endpoint for persistent sessions
      const loginEndpoint = 'login-with-remember';
      
      // 1. Авторизация
      const response = await login({ ...formData, endpoint: loginEndpoint });
      const { access_token, refresh_token, expires_in, remember_me: isRememberMe } = response.data;
      
      console.log('✅ Login successful');
      console.log('Token expires in:', expires_in, 'seconds');
      console.log('Persistent session:', isRememberMe);

      // 2. Получаем профиль пользователя
      console.log('\n=== FETCHING PROFILE ===');
      const profileRes = await getProfile();
      const user = profileRes.data;
      console.log('✅ Profile loaded:', user);

      // 3. Сохраняем в Redux и localStorage
      dispatch(setCredentials({ access_token, user }));
      
      // Save refresh token and session info
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      localStorage.setItem('session_expires_at', Date.now() + (expires_in * 1000));
      localStorage.setItem('remember_me', 'true'); // Always persistent
      
      console.log('\n✅ Navigation to admin panel...\n');
      toast.success(`Добро пожаловать, ${user.first_name || 'Администратор'}!`);
      navigate('/admin');
    } catch (err) {
      console.error('❌ Login error:', err);
      console.error('Response:', err.response?.data);
      toast.error(err.response?.data?.detail || 'Неверный логин или пароль');
      // Очищаем токены при ошибке
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('session_expires_at');
      localStorage.removeItem('remember_me');
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            🔐
          </div>
          <h1 className="text-3xl font-medium text-gray-800">Добро пожаловать</h1>
          <p className="text-gray-600 mt-2">Введите данные для входа</p>
        </div>


        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700 mb-2">
                Email или телефон
              </label>
              <input
                type="text"
                id="emailOrPhone"
                name="emailOrPhone"
                value={formData.emailOrPhone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="email@example.com или +7 (999) 123-45-67"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-xl text-lg font-medium hover:bg-green-700 transition disabled:bg-gray-500"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/admin/reset-password')}
            className="text-sm text-green-600 hover:text-green-700 hover:underline"
          >
            Забыли пароль?
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Николаевские бани
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;