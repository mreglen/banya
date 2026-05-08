import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from '../../utils/baseQuery';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Baths', 'Partners', 'Clients', 'Users', 'Roles', 'Reservations', 'Bookings', 'ReservationStatus', 'Permissions', 'Promotions', 'AuditLogs', 'Organization', 'Finance'],

  endpoints: (builder) => ({
    // ========================
    // 🛁 БАНИ — ПОЛНЫЙ CRUD + ЗАГРУЗКА ФОТО
    // ========================
    getBaths: builder.query({
      query: () => '/baths/',
      transformResponse: (response) => {
        if (!Array.isArray(response)) {
          console.error('Expected array, got:', response);
          return [];
        }

        return response.map(bath => {
          const bathId = bath.bath_id || bath.id;
          if (!bathId) {
            console.warn('Bath without bath_id:', bath);
            return null;
          }

          return {
            ...bath,
            bath_id: bathId,
            image: bath.photos?.[0]?.image_url || '/img/placeholder.svg',
            path: `/baths/${bath.slug}`,
            subtitle: bath.title,
          };
        }).filter(Boolean);
      },
      providesTags: [{ type: 'Baths', id: 'LIST' }],
    }),

    getBathById: builder.query({
      query: (slug) => `/baths/${slug}`,
      transformResponse: (response) => {
        if (!response) return null;

        return {
          ...response,
          bath_id: response.bath_id,
          image: response.photos?.[0]?.image_url || '/img/placeholder.svg',
          images: response.photos?.map(p => p.image_url) || [],
          path: `/baths/${response.slug}`,
          subtitle: response.title,
        };
      },
      providesTags: (result, error, arg) =>
        result
          ? [{ type: 'Baths', id: arg }]
          : [{ type: 'Baths', id: 'LIST' }],
    }),

    getWebsiteCategoriesPreview: builder.query({
      query: () => '/admin/categories/website/preview',
    }),

    createBath: builder.mutation({
      query: (body) => ({
        url: '/baths/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Baths', id: 'LIST' }],
    }),

    updateBath: builder.mutation({
      query: ({ bath_id, ...body }) => ({
        url: `/baths/${bath_id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Baths', id: 'LIST' }],
    }),

    deleteBath: builder.mutation({
      query: (id) => ({
        url: `/baths/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Baths', id: 'LIST' }],
    }),

    uploadBathPhotos: builder.mutation({
      query: ({ bath_id, files }) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        return {
          url: `/baths/${bath_id}/upload`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: [{ type: 'Baths', id: 'LIST' }],
    }),

    deleteBathPhoto: builder.mutation({
      query: ({ bath_id, photo_id }) => ({
        url: `/baths/${bath_id}/photos/${photo_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { bath_id }) => [
        { type: 'Baths', id: 'LIST' },
        { type: 'Baths', id: bath_id },
      ],
    }),

    // ========================
    // 📄 ЗАЯВКИ С САЙТА — АДМИН
    // ========================
    getBookings: builder.query({
      query: () => '/bookings/',
      transformResponse: (response) => {
        if (!Array.isArray(response)) {
          console.error('Expected array for bookings, got:', response);
          return [];
        }
        return response.map(booking => ({
          ...booking,
          isUnread: !booking.is_read,
          formattedDate: new Date(booking.date).toLocaleDateString('ru-RU'),
          formattedTime: new Date(booking.created_at).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
          }),
        }));
      },
      providesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),

    markBookingAsRead: builder.mutation({
      query: (id) => ({
        url: `/bookings/${id}/mark-read`,
        method: 'PUT',
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),

    createBooking: builder.mutation({
      query: (bookingData) => ({
        url: '/bookings/',
        method: 'POST',
        body: bookingData,
      }),
      invalidatesTags: [{ type: 'Bookings', id: 'LIST' }],
    }),
    getBookingAvailability: builder.query({
      query: ({ date, bath_id, days = 2 }) =>
        `/bookings/availability?date=${encodeURIComponent(date)}&bath_id=${bath_id}&days=${days}`,
    }),

    // ========================
    // 🏢 ОРГАНИЗАЦИЯ — РЕКВИЗИТЫ
    // ========================
    getOrganization: builder.query({
      query: () => '/organization/',
      providesTags: [{ type: 'Organization', id: 'SINGLE' }],
    }),

    adminGetOrganization: builder.query({
      query: () => '/admin/organization/',
      providesTags: [{ type: 'Organization', id: 'SINGLE' }],
    }),

    adminUpdateOrganization: builder.mutation({
      query: (body) => ({
        url: '/admin/organization/',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Organization', id: 'SINGLE' }],
    }),

    // ========================
    // 👥 ПАРТНЁРЫ
    // ========================
    getPartners: builder.query({
      query: () => '/admin/company/partner/',
      providesTags: [{ type: 'Partners', id: 'LIST' }],
    }),
    getPartnerById: builder.query({
      query: (id) => `/admin/company/partner/${id}`,
      providesTags: (result, error, id) => [{ type: 'Partners', id }],
    }),
    createPartner: builder.mutation({
      query: (partnerData) => ({
        url: '/admin/company/partner/',
        method: 'POST',
        body: partnerData,
      }),
      invalidatesTags: [{ type: 'Partners', id: 'LIST' }],
    }),
    updatePartner: builder.mutation({
      query: ({ id, ...partnerData }) => ({
        url: `/admin/company/partner/${id}`,
        method: 'PUT',
        body: partnerData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Partners', id: 'LIST' },
        { type: 'Partners', id },
      ],
    }),
    deletePartner: builder.mutation({
      query: (id) => ({
        url: `/admin/company/partner/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Partners', id: 'LIST' }],
    }),

    // ========================
    // 👥 КЛИЕНТЫ
    // ========================
    getClients: builder.query({
      query: () => '/admin/company/client/',
      providesTags: [{ type: 'Clients', id: 'LIST' }],
    }),
    getClientsById: builder.query({
      query: (id) => `/admin/company/client/${id}`,
      providesTags: (result, error, id) => [{ type: 'Clients', id }],
    }),
    createClients: builder.mutation({
      query: (clientsData) => ({
        url: '/admin/company/client/',
        method: 'POST',
        body: clientsData,
      }),
      invalidatesTags: [{ type: 'Clients', id: 'LIST' }],
    }),
    updateClients: builder.mutation({
      query: ({ id, ...partnerData }) => ({
        url: `/admin/company/client/${id}`,
        method: 'PUT',
        body: partnerData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Clients', id: 'LIST' },
        { type: 'Clients', id },
      ],
    }),
    deleteClients: builder.mutation({
      query: (id) => ({
        url: `/admin/company/client/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Clients', id: 'LIST' }],
    }),

    // ========================
    // 👤 ПОЛЬЗОВАТЕЛИ (СОТРУДНИКИ)
    // ========================
    getUsers: builder.query({
      query: () => '/admin/company/users/',
      providesTags: [{ type: 'Users', id: 'LIST' }],
    }),
    getUserById: builder.query({
      query: (id) => `/admin/company/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'Users', id }],
    }),
    createUser: builder.mutation({
      query: (userData) => ({
        url: '/admin/company/users/',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),
    updateUser: builder.mutation({
      query: ({ user_id, ...userData }) => ({
        url: `/admin/company/users/${user_id}`,
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: (result, error, { user_id }) => [
        { type: 'Users', id: 'LIST' },
        { type: 'Users', id: user_id },
      ],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/admin/company/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),

    // ========================
    // 👥 РОЛИ
    // ========================
    getRoles: builder.query({
      query: () => '/admin/company/role/',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Roles', id })), { type: 'Roles', id: 'LIST' }]
          : [{ type: 'Roles', id: 'LIST' }],
    }),
    createRole: builder.mutation({
      query: (body) => ({ url: '/admin/company/role/', method: 'POST', body }),
      invalidatesTags: [{ type: 'Roles', id: 'LIST' }],
    }),
    updateRole: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/admin/company/role/${id}`, method: 'PUT', body }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Roles', id },
        { type: 'Roles', id: 'LIST' },
      ],
    }),
    deleteRole: builder.mutation({
      query: (id) => ({ url: `/admin/company/role/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Roles', id: 'LIST' }],
    }),

    // ========================
    // 🔐 ПРАВА ДОСТУПА (Page Permissions)
    // ========================
    getPermissions: builder.query({
      query: () => '/admin/permissions/',
      providesTags: [{ type: 'Permissions', id: 'LIST' }],
    }),
    updatePermission: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/permissions/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Permissions', id: 'LIST' }],
    }),

    // ========================
    // 🆕 НОВЫЕ ПРАВА ДОСТУПА (New Permission System)
    // ========================
    getNewPermissions: builder.query({
      query: () => '/admin/permissions/new/',
      providesTags: [{ type: 'Permissions', id: 'NEW_LIST' }],
    }),
    getPermissionCategories: builder.query({
      query: () => '/admin/permissions/new/categories',
      providesTags: [{ type: 'PermissionCategories', id: 'LIST' }],
    }),

    // ========================
    // 📋 ЖУРНАЛ АУДИТА
    // ========================
    getAuditLogs: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.skip) queryParams.append('skip', params.skip);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.user_id) queryParams.append('user_id', params.user_id);
        if (params.entity_type) queryParams.append('entity_type', params.entity_type);
        if (params.action) queryParams.append('action', params.action);
        if (params.date_from) queryParams.append('date_from', params.date_from);
        if (params.date_to) queryParams.append('date_to', params.date_to);
        
        const queryString = queryParams.toString();
        return `/audit/logs${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: [{ type: 'AuditLogs', id: 'LIST' }],
    }),

    getFinanceAccounts: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.active_only) queryParams.append('active_only', 'true');
        const queryString = queryParams.toString();
        return `/finance/accounts${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: [{ type: 'Finance', id: 'ACCOUNTS' }],
    }),

    createFinanceAccount: builder.mutation({
      query: (body) => ({
        url: '/admin/finance/accounts',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Finance', id: 'ACCOUNTS' }],
    }),

    updateFinanceAccount: builder.mutation({
      query: ({ account_id, ...body }) => ({
        url: `/admin/finance/accounts/${account_id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Finance', id: 'ACCOUNTS' }],
    }),

    deleteFinanceAccount: builder.mutation({
      query: (account_id) => ({
        url: `/admin/finance/accounts/${account_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Finance', id: 'ACCOUNTS' }],
    }),

    getFinanceOperations: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.operation_type) queryParams.append('operation_type', params.operation_type);
        if (params.period) queryParams.append('period', params.period);
        if (params.date_from) queryParams.append('date_from', params.date_from);
        if (params.date_to) queryParams.append('date_to', params.date_to);
        if (params.account_id !== '' && params.account_id !== null && params.account_id !== undefined) {
          queryParams.append('account_id', params.account_id);
        }
        if (params.skip !== undefined) queryParams.append('skip', params.skip);
        if (params.limit !== undefined) queryParams.append('limit', params.limit);
        return `/finance/operations?${queryParams.toString()}`;
      },
      providesTags: [{ type: 'Finance', id: 'OPERATIONS' }],
    }),

    getFinanceSummary: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.period) queryParams.append('period', params.period);
        if (params.date_from) queryParams.append('date_from', params.date_from);
        if (params.date_to) queryParams.append('date_to', params.date_to);
        if (params.account_id !== '' && params.account_id !== null && params.account_id !== undefined) {
          queryParams.append('account_id', params.account_id);
        }
        return `/finance/summary?${queryParams.toString()}`;
      },
      providesTags: [{ type: 'Finance', id: 'SUMMARY' }],
    }),

    getFinanceOperationDetail: builder.query({
      query: ({ source, id }) => `/finance/operation/${source}/${id}`,
      providesTags: (result, error, arg) => [{ type: 'Finance', id: `DETAIL-${arg?.source}-${arg?.id}` }],
    }),
  }),
});

export const {
  useGetPermissionsQuery,
  useUpdatePermissionMutation,
  useGetNewPermissionsQuery,
  useGetPermissionCategoriesQuery,

  useGetBathsQuery,
  useGetBathByIdQuery,
  useGetWebsiteCategoriesPreviewQuery,
  useCreateBathMutation,
  useUpdateBathMutation,
  useDeleteBathMutation,
  useUploadBathPhotosMutation,
  useDeleteBathPhotoMutation,

  useGetBookingsQuery,
  useMarkBookingAsReadMutation,
  useCreateBookingMutation,
  useGetBookingAvailabilityQuery,

  useGetOrganizationQuery,
  useAdminGetOrganizationQuery,
  useAdminUpdateOrganizationMutation,

  useGetPartnersQuery,
  useGetPartnerByIdQuery,
  useCreatePartnerMutation,
  useUpdatePartnerMutation,
  useDeletePartnerMutation,

  useGetClientsQuery,
  useGetClientsByIdQuery,
  useCreateClientsMutation,
  useUpdateClientsMutation,
  useDeleteClientsMutation,

  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,

  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,

  useGetAuditLogsQuery,
  useGetFinanceAccountsQuery,
  useCreateFinanceAccountMutation,
  useUpdateFinanceAccountMutation,
  useDeleteFinanceAccountMutation,
  useGetFinanceOperationsQuery,
  useGetFinanceSummaryQuery,
  useGetFinanceOperationDetailQuery,
} = apiSlice;