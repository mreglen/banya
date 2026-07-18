import { createSlice } from '@reduxjs/toolkit';

const createEmptyState = () => ({
  date: new Date().toISOString().split('T')[0],
  comment: '',
  items: [],
  isLoading: false,
  error: null,
});

const productRequestFormSlice = createSlice({
  name: 'productRequestForm',
  initialState: createEmptyState(),
  reducers: {
    setInitialState: (_state, action) => ({
      ...createEmptyState(),
      ...action.payload,
      items: action.payload?.items ? [...action.payload.items] : [],
    }),
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
    resetForm: () => createEmptyState(),
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
