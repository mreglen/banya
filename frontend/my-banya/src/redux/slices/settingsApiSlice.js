import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../../utils/baseQuery';

export const settingsApiSlice = createApi({
    reducerPath: 'settingsApi',
    baseQuery,
    tagTypes: ['Settings', 'PaymentQrCode'],
    endpoints: (builder) => ({
        getSettings: builder.query({
            query: () => '/admin/settings/',
            providesTags: ['Settings'],
            transformResponse: (response) => {
                // Transform array of settings to object for easier access
                const settingsObj = {};
                response.forEach(setting => {
                    settingsObj[setting.key] = setting.value;
                });
                return settingsObj;
            },
        }),
        updateSettings: builder.mutation({
            query: (settingsData) => ({
                url: '/admin/settings/',
                method: 'PUT',
                body: settingsData,
            }),
            invalidatesTags: ['Settings'],
        }),
        getPaymentQrCode: builder.query({
            query: () => '/admin/settings/payment-qrcode',
            providesTags: ['PaymentQrCode'],
        }),
        uploadPaymentQrCode: builder.mutation({
            query: (file) => {
                const formData = new FormData();
                formData.append('file', file);
                return {
                    url: '/admin/settings/payment-qrcode',
                    method: 'POST',
                    body: formData,
                };
            },
            invalidatesTags: ['PaymentQrCode'],
        }),
    }),
});

export const {
    useGetSettingsQuery,
    useUpdateSettingsMutation,
    useGetPaymentQrCodeQuery,
    useUploadPaymentQrCodeMutation,
} = settingsApiSlice;
