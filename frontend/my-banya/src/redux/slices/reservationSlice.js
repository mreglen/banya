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
            invalidatesTags: ['Reservations'],
        }),
        updateReservation: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/admin/reservations/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Reservations'],
        }),
        deleteReservation: builder.mutation({
            query: (id) => ({
                url: `/admin/reservations/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Reservations'],
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
        getReservationById: builder.query({
            query: (id) => `/admin/reservations/${id}`,
            providesTags: (result, error, id) => [{ type: 'Reservations', id }],
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
    useGetReservationByIdQuery,

} = reservationApiSlice;