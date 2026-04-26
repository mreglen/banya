// src/redux/slices/deletionRequestsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = []; // ← массив вместо Set

const deletionRequestsSlice = createSlice({
  name: 'deletionRequests',
  initialState,
  reducers: {
    markForDeletion: (state, action) => {
      if (!state.includes(action.payload)) {
        state.push(action.payload);
      }
    },
    unmarkForDeletion: (state, action) => {
      return state.filter(id => id !== action.payload); // или используем splice, но filter чище
    },
    confirmDeletion: (state, action) => {
      return state.filter(id => id !== action.payload);
    },
    clearAllDeletionRequests: () => {
      return [];
    },
  },
});

export const { markForDeletion, unmarkForDeletion, confirmDeletion, clearAllDeletionRequests } = deletionRequestsSlice.actions;

export default deletionRequestsSlice.reducer;