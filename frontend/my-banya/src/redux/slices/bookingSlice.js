import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';


const getApiUrl = () => {
  // Проверяем, что import.meta и import.meta.env доступны
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    // return import.meta.env.VITE_API_URL || 'http://192.168.0.100:3001';
  }

  return 'http://127.0.0.1:8000';
  // return 'http://192.168.0.100:3001';
};

const API_BASE_URL = getApiUrl();

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/bookings/`, bookingData);
      return response.data;
    } catch (error) {
      // Логируем ошибку для отладки
      console.error('Ошибка при отправке брони:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.detail || 
        error.message || 
        'Не удалось отправить бронь'
      );
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    resetStatus: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createBooking.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetStatus } = bookingSlice.actions;
export default bookingSlice.reducer;