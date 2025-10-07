import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.100:3001';

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/api/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});


export const login = (credentials) => {
  const formData = new FormData();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  return adminApi.post('/login', formData, {
    headers: {
      'Content-Type': 'multipart/form-data', 
    },
  });
};

export default adminApi;