import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

// Создаем базовый экземпляр axios с общими настройками
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Флаг для предотвращения нескольких одновременных обновлений токена
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Добавляем перехватчик для автоматической установки токена авторизации
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Добавляем перехватчик для обработки ошибок с автоматическим обновлением токена
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Проверяем, есть ли refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      
      // Если нет refresh token, redirect на логин
      if (!refreshToken) {
        console.error('🔐 Authentication error: No refresh token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/admin/login';
        return Promise.reject(error);
      }
      
      // Если уже идет процесс обновления, добавляем запрос в очередь
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        console.log('🔄 Attempting to refresh token...');
        
        // Делаем запрос на обновление токена
        const response = await axios.post(`${API_BASE_URL}/admin/refresh`, null, {
          headers: {
            'Authorization': `Bearer ${refreshToken}`
          }
        });
        
        const { access_token, refresh_token, expires_in } = response.data;
        
        // Сохраняем новые токены
        localStorage.setItem('access_token', access_token);
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token);
        }
        if (expires_in) {
          localStorage.setItem('session_expires_at', Date.now() + (expires_in * 1000));
        }
        
        console.log('✅ Token refreshed successfully');
        
        // Обрабатываем очередь запросов
        processQueue(null, access_token);
        
        // Повторяем оригинальный запрос с новым токеном
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Если не удалось обновить токен, очищаем всё и redirect
        console.error('❌ Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('session_expires_at');
        localStorage.removeItem('remember_me');
        
        window.location.href = '/admin/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
