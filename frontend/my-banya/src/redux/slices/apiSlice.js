import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://127.0.0.1:8000/api',
    // baseUrl: 'http://192.168.0.100:3001/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Baths', 'Massages', 'Menu', 'Brooms'],

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
            image: bath.photos?.[0]?.image_url || '/img/placeholder.jpg',
            path: `/baths/${bathId}`,
            subtitle: bath.title,
          };
        }).filter(Boolean);
      },
      providesTags: [{ type: 'Baths', id: 'LIST' }],
    }),

    getBathById: builder.query({
      query: (id) => `/baths/${id}`,
      transformResponse: (response) => {
        if (!response) return null;

        return {
          ...response,
          bath_id: response.bath_id,
          image: response.photos?.[0]?.image_url || '/img/placeholder.jpg',
          images: response.photos?.map(p => p.image_url) || [],
          path: `/baths/${response.bath_id}`,
          subtitle: response.title,
        };
      },
      providesTags: (result, error, arg) =>
        result
          ? [{ type: 'Baths', id: arg }]
          : [{ type: 'Baths', id: 'LIST' }],
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

    // 👇 НОВЫЙ ЭНДПОИНТ: ЗАГРУЗКА ФОТО ЧЕРЕЗ ФАЙЛ
    uploadBathPhotos: builder.mutation({
      query: ({ bath_id, files }) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        return {
          url: `/baths/${bath_id}/upload`,
          method: 'POST',
          body: formData,
          // 👇 ВАЖНО: не использовать JSON-сериализацию для FormData!
          // Это автоматически делается fetch-ом
        };
      },
      invalidatesTags: [{ type: 'Baths', id: 'LIST' }],
    }),

    // ========================
    // 💆 МАССАЖИ — ПОЛНЫЙ CRUD
    // ========================
    getMassages: builder.query({
      query: () => '/massages',
      transformResponse: (response) => {
        if (!Array.isArray(response)) {
          console.error('Expected array for massages, got:', response);
          return [];
        }
        return response.map(massage => ({
          ...massage,
          massage_id: massage.massage_id,
          price: `${massage.cost} ₽`,
          description: massage.description || 'Описание не доступно',
          name: massage.name || 'Без названия',
        }));
      },
      providesTags: [{ type: 'Massages', id: 'LIST' }],
    }),

    getMassageById: builder.query({
      query: (id) => `/massages/${id}`,
      transformResponse: (response) => {
        if (!response) return null;
        return {
          ...response,
          massage_id: response.massage_id,
          price: `${response.cost} ₽`,
          description: response.description || 'Описание не доступно',
          name: response.name || 'Без названия',
        };
      },
      providesTags: (result, error, arg) =>
        result
          ? [{ type: 'Massages', id: arg }]
          : [{ type: 'Massages', id: 'LIST' }],
    }),

    createMassage: builder.mutation({
      query: (body) => ({
        url: '/massages/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Massages', id: 'LIST' }],
    }),

    updateMassage: builder.mutation({
      query: ({ massage_id, ...body }) => ({
        url: `/massages/${massage_id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Massages', id: 'LIST' }],
    }),

    deleteMassage: builder.mutation({
      query: (id) => ({
        url: `/massages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Massages', id: 'LIST' }],
    }),

    // ================
    // 🍽️ КУХНЯ — КАТЕГОРИИ CRUD
    // ================
    getAllMenuItems: builder.query({
      query: () => '/kitchen/',
      transformResponse: (response) => {
        if (!Array.isArray(response)) {
          console.error('Expected array for kitchen menu, got:', response);
          return [];
        }
        return response.map(item => ({
          ...item,
          id: item.id,
          price: item.price,
          category: item.category?.slug || item.category,
          name: item.name,
          description: item.description || 'Идеально дополняет атмосферу бани',
        }));
      },
      providesTags: [{ type: 'Menu', id: 'LIST' }],
    }),
    getMenuCategories: builder.query({
      query: () => '/kitchen/categories',
      transformResponse: (response) => {
        if (!Array.isArray(response)) {
          console.error('Expected array for categories, got:', response);
          return [];
        }
        return response.map(cat => ({
          id: cat.id,          // 👈 теперь используем id для мутаций
          slug: cat.slug,
          label: cat.name,
          name: cat.name,
          order: cat.order,
        })).sort((a, b) => a.order - b.order);
      },
      providesTags: [{ type: 'Menu', id: 'CATEGORIES' }],
    }),

    createMenuCategory: builder.mutation({
      query: (body) => ({
        url: '/kitchen/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Menu', id: 'CATEGORIES' }],
    }),

    updateMenuCategory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/kitchen/categories/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Menu', id: 'CATEGORIES' }],
    }),

    deleteMenuCategory: builder.mutation({
      query: (id) => ({
        url: `/kitchen/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Menu', id: 'CATEGORIES' }],
    }),

    // ================
    // 🍽️ КУХНЯ — ТОВАРЫ CRUD
    // ================

    createMenuItem: builder.mutation({
      query: (body) => ({
        url: '/kitchen/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Menu', id: 'LIST' }],
    }),

    updateMenuItem: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/kitchen/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Menu', id: 'LIST' }],
    }),

    deleteMenuItem: builder.mutation({
      query: (id) => ({
        url: `/kitchen/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Menu', id: 'LIST' }],
    }),
    // ========================
    // 🌿 ВЕНИКИ — НОВЫЕ ЭНДПОИНТЫ
    // ========================
    getBrooms: builder.query({
      query: () => '/brooms/',
      transformResponse: (response) => {
        if (!Array.isArray(response)) {
          console.error('Expected array for brooms, got:', response);
          return [];
        }
        return response.map(broom => ({
          ...broom,
          id: broom.id,
          price: broom.price,
          quantity: broom.quantity,
          name: broom.name,
        }));
      },
      providesTags: [{ type: 'Brooms', id: 'LIST' }],
    }),

    getBroomById: builder.query({
      query: (id) => `/brooms/${id}`,
      transformResponse: (response) => {
        if (!response) return null;
        return {
          ...response,
          id: response.id,
          price: response.price,
          quantity: response.quantity,
          name: response.name,
        };
      },
      providesTags: (result, error, arg) =>
        result
          ? [{ type: 'Brooms', id: arg }]
          : [{ type: 'Brooms', id: 'LIST' }],
    }),

    createBroom: builder.mutation({
      query: (body) => ({
        url: '/brooms/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Brooms', id: 'LIST' }],
    }),

    updateBroom: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/brooms/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Brooms', id: 'LIST' }],
    }),

    deleteBroom: builder.mutation({
      query: (id) => ({
        url: `/brooms/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Brooms', id: 'LIST' }],
    }),
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
          // Добавляем удобные поля для UI
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
    // reservations_status
    getReservationStatuses: builder.query({
      query: () => '/admin/reservation-status/',
      providesTags: [{ type: 'ReservationStatus', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetBathsQuery,
  useGetBathByIdQuery,

  useCreateBathMutation,
  useUpdateBathMutation,
  useDeleteBathMutation,
  useUploadBathPhotosMutation,

  useGetMassagesQuery,
  useGetMassageByIdQuery,

  useCreateMassageMutation,
  useUpdateMassageMutation,
  useDeleteMassageMutation,

  useGetAllMenuItemsQuery,
  useGetMenuByCategoryQuery,
  useGetMenuCategoriesQuery,
  useCreateMenuCategoryMutation,
  useUpdateMenuCategoryMutation,
  useDeleteMenuCategoryMutation,

  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,

  useGetBroomsQuery,
  useGetBroomByIdQuery,
  useCreateBroomMutation,
  useUpdateBroomMutation,
  useDeleteBroomMutation,

  useGetReservationsByDateQuery,
  useCreateReservationMutation,
  useUpdateReservationMutation,
  useDeleteReservationMutation,

  useGetBookingsQuery,
  useMarkBookingAsReadMutation,
  useCreateBookingMutation,

  useGetReservationStatusesQuery,

} = apiSlice;