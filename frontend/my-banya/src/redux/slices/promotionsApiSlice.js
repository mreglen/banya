import { apiSlice } from './apiSlice';

export const promotionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPromotions: builder.query({
      query: () => '/promotions',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Promotions', id })),
              { type: 'Promotions', id: 'LIST' },
            ]
          : [{ type: 'Promotions', id: 'LIST' }],
    }),
    getPromotion: builder.query({
      query: (id) => `/promotions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Promotions', id }],
    }),
    createPromotion: builder.mutation({
      query: (data) => ({
        url: '/promotions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Promotions', id: 'LIST' }],
    }),
    updatePromotion: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/promotions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Promotions', id: 'LIST' },
        { type: 'Promotions', id },
      ],
    }),
    deletePromotion: builder.mutation({
      query: (id) => ({
        url: `/promotions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Promotions', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetPromotionsQuery,
  useGetPromotionQuery,
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
} = promotionsApi;
