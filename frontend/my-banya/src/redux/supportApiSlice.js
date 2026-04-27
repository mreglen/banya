import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = process.env.REACT_APP_API_URL || '/api';

export const supportApi = createApi({
  reducerPath: 'supportApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['SupportTicket', 'SupportTickets'],
  endpoints: (builder) => ({
    // Получить свои обращения (для пользователей)
    getMyTickets: builder.query({
      query: () => '/support/tickets',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'SupportTicket', id })),
              { type: 'SupportTickets', id: 'LIST' },
            ]
          : [{ type: 'SupportTickets', id: 'LIST' }],
    }),

    // Получить все обращения (для админов)
    getAllTickets: builder.query({
      query: (statusFilter) => {
        const params = statusFilter ? `?status_filter=${statusFilter}` : '';
        return `/support/admin/tickets${params}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'SupportTicket', id })),
              { type: 'SupportTickets', id: 'LIST' },
            ]
          : [{ type: 'SupportTickets', id: 'LIST' }],
    }),

    // Получить детали обращения
    getTicket: builder.query({
      query: (ticketId) => `/support/tickets/${ticketId}`,
      providesTags: (result, error, ticketId) => [{ type: 'SupportTicket', id: ticketId }],
    }),

    // Создать обращение
    createTicket: builder.mutation({
      query: (formData) => ({
        url: '/support/tickets',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: [{ type: 'SupportTickets', id: 'LIST' }],
    }),

    // Отправить сообщение (REST)
    sendMessage: builder.mutation({
      query: ({ ticketId, message }) => ({
        url: `/support/tickets/${ticketId}/messages`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: (result, error, { ticketId }) => [
        { type: 'SupportTicket', id: ticketId },
      ],
    }),

    // Изменить статус обращения (только для админов)
    updateTicketStatus: builder.mutation({
      query: ({ ticketId, status }) => ({
        url: `/support/admin/tickets/${ticketId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { ticketId }) => [
        { type: 'SupportTicket', id: ticketId },
        { type: 'SupportTickets', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetMyTicketsQuery,
  useGetAllTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useSendMessageMutation,
  useUpdateTicketStatusMutation,
} = supportApi;
