import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../utils/apiClient';

function PasswordResetRequest() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await apiClient.post('/admin/password-reset/request', {
        email
      });

      setSuccess(response.data.message);
      
      // Navigate to verification after short delay
      setTimeout(() => {
        navigate('/admin/reset-password/verify', { 
          state: { email } 
        });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            🔑
          </div>
          <h1 className="text-3xl font-medium text-gray-800">Сброс пароля</h1>
          <p className="text-gray-600 mt-2">Введите ваш email для получения кода</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 bg-green-50 text-green-600 text-sm rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="email@example.com"
                required
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-xl text-lg font-medium hover:bg-green-700 transition disabled:bg-gray-500"
            >
              {loading ? 'Отправка...' : 'Отправить код'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/admin/login')}
            className="text-sm text-green-600 hover:text-green-700 hover:underline"
          >
            ← Вернуться ко входу
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Николаевские бани
        </div>
      </div>
    </div>
  );
}

export default PasswordResetRequest;
