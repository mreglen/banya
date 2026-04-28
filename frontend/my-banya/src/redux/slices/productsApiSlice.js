// src/redux/slices/productsApiSlice.js
import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../../utils/baseQuery';

export const productsApiSlice = createApi({
    reducerPath: 'productsApi',
    baseQuery,
    tagTypes: ['Category', 'Product', 'RealizationDocument'],
    endpoints: (builder) => ({
        // --- КАТЕГОРИИ ---
        getCategories: builder.query({
            query: () => '/admin/categories/',
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Category', id })), { type: 'Category', id: 'LIST' }]
                    : [{ type: 'Category', id: 'LIST' }],
        }),

        createCategory: builder.mutation({
            query: (categoryData) => ({
                url: '/admin/categories/',
                method: 'POST',
                body: categoryData,
            }),
            invalidatesTags: [{ type: 'Category', id: 'LIST' }],
        }),

        deleteCategory: builder.mutation({
            query: (categoryId) => ({
                url: `/admin/categories/${categoryId}/`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, arg) => [
                { type: 'Category', id: 'LIST' },
                { type: 'Category', id: arg },
            ],
        }),

        updateCategory: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/admin/categories/${id}/`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Category', id: 'LIST' },
                { type: 'Category', id }
            ],
        }),
        uploadCategoryPhotos: builder.mutation({
            query: ({ categoryId, formData }) => ({
                url: `/admin/categories/${categoryId}/upload`,
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: (result, error, { categoryId }) => [
                { type: 'Category', id: categoryId }
            ],
        }),

        // --- ТОВАРЫ ---
        getProducts: builder.query({
            query: () => '/admin/products/',
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Product', id })), { type: 'Product', id: 'LIST' }]
                    : [{ type: 'Product', id: 'LIST' }],
        }),
        getProductById: builder.query({
            query: (productId) => `/admin/products/${productId}/`,
            providesTags: (result, error, id) => [{ type: 'Product', id }],
        }),
        getUnitsOfMeasurement: builder.query({
            query: () => '/admin/products/units/',
            providesTags: [{ type: 'Unit', id: 'LIST' }],
        }),

        createUnit: builder.mutation({
            query: (unitData) => ({
                url: '/admin/products/units/',
                method: 'POST',
                body: unitData,
            }),
            invalidatesTags: [{ type: 'Unit', id: 'LIST' }],
        }),

        updateUnit: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/admin/products/units/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: [{ type: 'Unit', id: 'LIST' }],
        }),

        deleteUnit: builder.mutation({
            query: (id) => ({
                url: `/admin/products/units/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Unit', id: 'LIST' }],
        }),

        createProduct: builder.mutation({
            query: (productData) => ({
                url: '/admin/products/',
                method: 'POST',
                body: productData,
            }),
            invalidatesTags: [{ type: 'Product', id: 'LIST' }],
        }),

        // --- СКЛАД ---
        getStockProducts: builder.query({
            query: () => '/admin/stock/products',
            providesTags: [{ type: 'Product', id: 'STOCK_LIST' }],
        }),

        updateProduct: builder.mutation({
            query: (productData) => ({
                url: `/admin/products/${productData.id}/`,
                method: 'PUT',
                body: productData,
            }),
            invalidatesTags: (result, error, arg) => [
                { type: 'Product', id: 'LIST' },
                { type: 'Product', id: arg.id }
            ],
        }),
        uploadProductPhotos: builder.mutation({
            query: ({ productId, formData }) => ({
                url: `/admin/products/${productId}/upload`,
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: (result, error, { productId }) => [
                { type: 'Product', id: productId }
            ],
        }),
        // --- ДОКУМЕНТЫ ПОСТУПЛЕНИЯ ---
        getEntranceDocuments: builder.query({
            query: () => '/admin/documents/entrance/',
            providesTags: [{ type: 'EntranceDocument', id: 'LIST' }],
        }),

        getEntranceDocumentById: builder.query({
            query: (id) => `/admin/documents/entrance/${id}/`,
            providesTags: (result, error, id) => [{ type: 'EntranceDocument', id }],
        }),

        createEntranceDocument: builder.mutation({
            query: (body) => ({
                url: '/admin/documents/entrance/',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Product', id: 'LIST' }, { type: 'EntranceDocument', id: 'LIST' }],
        }),

        updateEntranceDocument: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/admin/documents/entrance/${id}/`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: [{ type: 'Product', id: 'LIST' }, { type: 'EntranceDocument', id: 'LIST' }],
        }),

        deleteEntranceDocument: builder.mutation({
            query: (id) => ({
                url: `/admin/documents/entrance/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'EntranceDocument', id: 'LIST' }],
        }),
        deleteProduct: builder.mutation({
            query: (productId) => ({
                url: `/admin/products/${productId}/`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, productId) => [
                { type: 'Product', id: 'LIST' },
                { type: 'Product', id: productId }
            ],
        }),

        // --- ДОКУМЕНТЫ РЕАЛИЗАЦИИ ---
        getRealizationDocuments: builder.query({
            query: () => '/admin/documents/realization/',
            providesTags: [{ type: 'RealizationDocument', id: 'LIST' }],
        }),

        getRealizationDocumentById: builder.query({
            query: (id) => `/admin/documents/realization/${id}/`,
            providesTags: (result, error, id) => [{ type: 'RealizationDocument', id }],
        }),

        deleteRealizationDocument: builder.mutation({
            query: (id) => ({
                url: `/admin/documents/realization/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'RealizationDocument', id: 'LIST' }, { type: 'Product', id: 'STOCK_LIST' }],
        }),

    }),
});

export const {
    useDeleteProductMutation,
    useGetCategoriesQuery,
    useCreateCategoryMutation,
    useDeleteCategoryMutation,
    useGetProductsQuery,
    useCreateProductMutation,
    useGetProductByIdQuery,
    useGetStockProductsQuery,
    useUpdateProductMutation,
    useUploadProductPhotosMutation,
    useGetEntranceDocumentsQuery,
    useGetEntranceDocumentByIdQuery,
    useCreateEntranceDocumentMutation,
    useUpdateEntranceDocumentMutation,
    useDeleteEntranceDocumentMutation,
    useUpdateCategoryMutation,
    useUploadCategoryPhotosMutation,
    useGetUnitsOfMeasurementQuery,
    useCreateUnitMutation,
    useUpdateUnitMutation,
    useDeleteUnitMutation,
    useGetRealizationDocumentsQuery,
    useGetRealizationDocumentByIdQuery,
    useDeleteRealizationDocumentMutation,

} = productsApiSlice;