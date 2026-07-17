import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  date: new Date().toISOString().split('T')[0],
  comment: '',
  items: [],
  isLoading: false,
  error: null,
};

const productRequestFormSlice = createSlice({
  name: 'productRequestForm',
  initialState,
  reducers: {
    setInitialState: (state, action) => {
      Object.assign(state, initialState, action.payload);
    },
    updateField: (state, action) => {
      const { field, value } = action.payload;
      state[field] = value;
    },
    addItem: (state, action) => {
      state.items.push(action.payload);
    },
    updateItem: (state, action) => {
      const { index, field, value } = action.payload;
      if (state.items[index]) {
        state.items[index][field] = value;
      }
    },
    removeItem: (state, action) => {
      state.items.splice(action.payload, 1);
    },
    resetForm: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  setInitialState,
  updateField,
  addItem,
  updateItem,
  removeItem,
  resetForm,
} = productRequestFormSlice.actions;

export default productRequestFormSlice.reducer;
