import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../../utils/apiClient';

function PasswordResetVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate('/admin/reset-password');
    }
  }, [email, navigate]);

  // Timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);

    // Focus on next empty input or last input
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs[nextIndex].current.focus();
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setError('Введите все 6 цифр');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await apiClient.post('/api/admin/password-reset/verify', {
        email,
        code: fullCode
      });

      // Navigate to password reset complete
      navigate('/admin/reset-password/complete', { 
        state: { email, code: fullCode } 
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setError('');
    setLoading(true);

    try {
      await apiClient.post('/api/admin/password-reset/request', { email });
      setResendTimer(30);
      setCanResend(false);
      setCode(['', '', '', '', '', '']);
      inputRefs[0].current.focus();
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ✉️
          </div>
          <h1 className="text-3xl font-medium text-gray-800">Подтверждение</h1>
          <p className="text-gray-600 mt-2">Введите код из email</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* 6-digit code input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Код подтверждения
            </label>
            <div className="flex justify-center gap-2 sm:gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl text-lg font-medium hover:bg-green-700 transition disabled:bg-gray-500"
          >
            {loading ? 'Проверка...' : 'Далее'}
          </button>

          {/* Resend code */}
          <div className="text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-sm text-green-600 hover:text-green-700 hover:underline disabled:text-gray-400"
              >
                Отправить код ещё раз
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                Отправить повторно через {resendTimer}с
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/admin/reset-password')}
            className="text-sm text-green-600 hover:text-green-700 hover:underline"
          >
            ← Вернуться назад
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Николаевские бани
        </div>
      </div>
    </div>
  );
}

export default PasswordResetVerify;
