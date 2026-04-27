import apiClient from '../../utils/apiClient';

// Используем базовый apiClient напрямую - он уже имеет все интерсепторы
const ADMIN_BASE_URL = `/api/admin`;

export const login = async (credentials) => {
  const formData = new FormData();
  formData.append('username', credentials.emailOrPhone); // Backend expects 'username' field
  formData.append('password', credentials.password);

  console.log('Login attempt for:', credentials.emailOrPhone);
  console.log('API Base URL:', ADMIN_BASE_URL);
  
  // Determine which endpoint to use
  const endpoint = credentials.endpoint || 'login';
  
  const response = await apiClient.post(`${ADMIN_BASE_URL}/${endpoint}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  // Сохраняем токены сразу после успешного логина
  if (response.data && response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
    console.log('✅ Access token saved to localStorage');
    
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
      console.log('✅ Refresh token saved to localStorage');
    }
  }
  
  return response;
};

export const refreshToken = async () => {
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) {
    throw new Error('No refresh token available');
  }
  
  const response = await apiClient.post(`${ADMIN_BASE_URL}/refresh`, null, {
    headers: {
      'Authorization': `Bearer ${refresh_token}`
    }
  });
  
  // Save new tokens
  if (response.data && response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    if (response.data.expires_in) {
      localStorage.setItem('session_expires_at', Date.now() + (response.data.expires_in * 1000));
    }
  }
  
  return response;
};

export const logout = async () => {
  try {
    await apiClient.post(`${ADMIN_BASE_URL}/logout`);
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear all tokens regardless of error
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('session_expires_at');
    localStorage.removeItem('remember_me');
  }
};

export const getActiveSessions = () => {
  return apiClient.get(`${ADMIN_BASE_URL}/sessions`);
};

export const revokeSession = (sessionId) => {
  return apiClient.delete(`${ADMIN_BASE_URL}/sessions/${sessionId}`);
};

export const getProfile = () => {
  const token = localStorage.getItem('access_token');
  console.log('getProfile - Token:', token ? 'Present' : 'Missing');
  return apiClient.get(`${ADMIN_BASE_URL}/me`);
};