import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const DEV_FALLBACK_API_URL = 'http://127.0.0.1:8000/api';
const isDev = process.env.NODE_ENV === 'development';


export const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    console.log('🔑 Token:', token ? 'Present' : 'Missing');
    return headers;
  },
});

const fallbackBaseQuery = fetchBaseQuery({
  baseUrl: DEV_FALLBACK_API_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Оборачиваем для логирования
const baseQueryWithLogging = async (args, api, extraOptions) => {
  console.log('📤 Request:', {
    url: typeof args === 'string' ? args : args.url,
    method: typeof args === 'string' ? 'GET' : args.method || 'GET',
    body: typeof args === 'string' ? undefined : args.body,
  });
  
  const result = await baseQuery(args, api, extraOptions);

  const shouldRetryWithFallback =
    isDev &&
    API_BASE_URL === '/api' &&
    result?.error &&
    (result.error.status === 502 || result.error.status === 'FETCH_ERROR');

  if (shouldRetryWithFallback) {
    console.warn('⚠️ API proxy error, retrying via direct backend URL...');
    const fallbackResult = await fallbackBaseQuery(args, api, extraOptions);
    console.log('📥 Fallback response:', {
      status: fallbackResult.meta?.response?.status,
      error: fallbackResult.error,
      data: fallbackResult.data,
    });
    return fallbackResult;
  }
  
  console.log('📥 Response:', {
    status: result.meta?.response?.status,
    error: result.error,
    data: result.data,
  });
  
  return result;
};

export default baseQueryWithLogging;
