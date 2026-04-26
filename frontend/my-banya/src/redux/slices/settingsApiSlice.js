import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../../utils/baseQuery';

export const settingsApiSlice = createApi({
    reducerPath: 'settingsApi',
    baseQuery,
    tagTypes: ['Settings'],
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
            invalidatesTags: [{ type: 'Settings', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetSettingsQuery,
    useUpdateSettingsMutation,
} = settingsApiSlice;
