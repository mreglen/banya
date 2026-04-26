// src/redux/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('access_token') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { access_token, user } = action.payload;
      state.token = access_token;
      state.user = user;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    logOut: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('logged_in_username');
    },
  },
});

export const { setCredentials, logOut } = authSlice.actions;

export default authSlice.reducer;