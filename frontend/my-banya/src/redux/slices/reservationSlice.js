// src/redux/slices/reservationSlice.js
import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../../utils/baseQuery';

export const reservationApiSlice = createApi({
    reducerPath: 'reservationApi',
    baseQuery,
    tagTypes: ['Reservations', 'ReservationStatus'],
    endpoints: (builder) => ({
        getReservationsByDate: builder.query({
            query: ({ date, bathId }) => {
                const params = new URLSearchParams();
                params.append('date', date);
                if (bathId !== undefined && bathId !== null) {
                    params.append('bath_id', bathId);
                }
                return `/admin/reservations/?${params.toString()}`;
            },
            providesTags: (result, error, arg) => [{ type: 'Reservations', id: arg.date }],
        }),
        createReservation: builder.mutation({
            query: (body) => ({
                url: '/admin/reservations/',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Reservations', id: 'LIST' }],
        }),
        updateReservation: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/admin/reservations/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: [{ type: 'Reservations', id: 'LIST' }],
        }),
        deleteReservation: builder.mutation({
            query: (id) => ({
                url: `/admin/reservations/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Reservations', id: 'LIST' }],
        }),
        getReservationStatuses: builder.query({
            query: () => '/admin/reservation-status/',
            providesTags: [{ type: 'ReservationStatus', id: 'LIST' }],
        }),
        getAllReservations: builder.query({
            query: (params = {}) => {
                const queryParams = new URLSearchParams();
                if (params.status) queryParams.append('status', params.status);
                const queryString = queryParams.toString();
                return `/admin/reservations/${queryString ? `?${queryString}` : ''}`;
            },
            providesTags: [{ type: 'Reservations', id: 'ALL' }],
        }),
    }),
});

export const {
    useGetReservationsByDateQuery,
    useCreateReservationMutation,
    useUpdateReservationMutation,
    useDeleteReservationMutation,
    useGetReservationStatusesQuery,
    useGetAllReservationsQuery,

} = reservationApiSlice;