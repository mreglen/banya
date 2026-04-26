// src/redux/slices/documentEntranceFormSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    // Основные данные документа
    date: new Date().toISOString().split('T')[0],
    supplierId: null,
    responsibleName: '', // Имя можно установить при инициализации или сохранении
    supplierNumber: '',
    // Позиции документа
    items: [],
    // Индикаторы загрузки и ошибок (опционально, но полезно)
    isLoading: false,
    error: null,
};

const documentEntranceFormSlice = createSlice({
    name: 'documentEntranceForm',
    initialState,
    reducers: {
        // Установить начальное состояние формы (например, при создании нового документа или загрузке для редактирования)
        setInitialState: (state, action) => {
            // action.payload: { date, supplierId, responsibleName, supplierNumber, items }
            // Слияние с initialState позволяет установить только нужные поля
            Object.assign(state, initialState, action.payload);
        },
        // Обновить общее поле формы
        updateField: (state, action) => {
            const { field, value } = action.payload;
            state[field] = value;
        },
        // Установить/обновить поставщика
        setSupplier: (state, action) => {
            state.supplierId = action.payload;
        },
        // Установить/обновить ответственного
        setResponsible: (state, action) => {
            state.responsibleName = action.payload;
        },
        // Добавить товар в позиции
        addItem: (state, action) => {
            // action.payload: { id, productId, name, quantity, purchasePrice }
            state.items.push(action.payload);
        },
        // Обновить поле конкретного товара в позициях
        updateItem: (state, action) => {
            const { index, field, value } = action.payload;
            if (state.items[index]) {
                state.items[index][field] = value;
            }
        },
        // Удалить товар из позиций
        removeItem: (state, action) => {
            const index = action.payload; // Индекс товара для удаления
            state.items.splice(index, 1);
        },
        // Очистить форму (например, после успешного сохранения)
        resetForm: (state) => {
            Object.assign(state, initialState);
        },
        // Установить флаг загрузки (опционально)
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        // Установить ошибку (опционально)
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const {
    setInitialState,
    updateField,
    setSupplier,
    setResponsible,
    addItem,
    updateItem,
    removeItem,
    resetForm,
    setLoading,
    setError,
} = documentEntranceFormSlice.actions;

export default documentEntranceFormSlice.reducer;