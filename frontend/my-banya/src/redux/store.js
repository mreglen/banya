// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice'; 
import { apiSlice } from './slices/apiSlice';
import { productsApiSlice } from './slices/productsApiSlice';
import { reservationApiSlice } from './slices/reservationSlice';
import { settingsApiSlice } from './slices/settingsApiSlice';
import { supportApi } from './supportApiSlice';
import deletionRequestsSlice from './slices/deletionRequestsSlice';
import bookingReducer from './slices/bookingSlice';
import documentEntranceFormReducer from './slices/documentEntranceFormSlice';
import productRequestFormReducer from './slices/productRequestFormSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer, 
    [apiSlice.reducerPath]: apiSlice.reducer,
    [productsApiSlice.reducerPath]: productsApiSlice.reducer,
    [reservationApiSlice.reducerPath]: reservationApiSlice.reducer,
    [settingsApiSlice.reducerPath]: settingsApiSlice.reducer,
    booking: bookingReducer,
    documentEntranceForm: documentEntranceFormReducer,
    productRequestForm: productRequestFormReducer,
    deletionRequests: deletionRequestsSlice,
    [supportApi.reducerPath]: supportApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(apiSlice.middleware)
      .concat(productsApiSlice.middleware)
      .concat(reservationApiSlice.middleware)
      .concat(settingsApiSlice.middleware)
      .concat(supportApi.middleware),
});