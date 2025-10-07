// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './slices/apiSlice'; 
import bookingReducer from './slices/bookingSlice';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer, 
    booking: bookingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});