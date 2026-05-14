import { apiSlice } from './apiSlice';

const DASHBOARD_URL = '/api/dashboard';

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Получить общую статистику
    getDashboardStatistics: builder.query({
      query: () => ({
        url: `${DASHBOARD_URL}/statistics`,
        method: 'GET',
      }),
      providesTags: (result) => 
        result ? [{ type: 'Dashboard', id: 'statistics' }] : [],
    }),

    // Получить данные для графика дохода
    getRevenueChartData: builder.query({
      query: (period = 'month') => ({
        url: `${DASHBOARD_URL}/revenue-chart`,
        method: 'GET',
        params: { period },
      }),
      providesTags: (result) => 
        result ? [{ type: 'Dashboard', id: 'revenue-chart' }] : [],
    }),

    // Получить данные для графика бронирований
    getReservationsChartData: builder.query({
      query: (days = 30) => ({
        url: `${DASHBOARD_URL}/reservations-chart`,
        method: 'GET',
        params: { days },
      }),
      providesTags: (result) => 
        result ? [{ type: 'Dashboard', id: 'reservations-chart' }] : [],
    }),

    // Получить данные для графика заявок с сайта
    getBookingsChartData: builder.query({
      query: (days = 30) => ({
        url: `${DASHBOARD_URL}/bookings-chart`,
        method: 'GET',
        params: { days },
      }),
      providesTags: (result) => 
        result ? [{ type: 'Dashboard', id: 'bookings-chart' }] : [],
    }),

    // Получить популярные бани
    getPopularBaths: builder.query({
      query: () => ({
        url: `${DASHBOARD_URL}/popular-baths`,
        method: 'GET',
      }),
      providesTags: (result) => 
        result ? [{ type: 'Dashboard', id: 'popular-baths' }] : [],
    }),

    // Получить последнюю активность
    getRecentActivity: builder.query({
      query: (limit = 10) => ({
        url: `${DASHBOARD_URL}/recent-activity`,
        method: 'GET',
        params: { limit },
      }),
      providesTags: (result) => 
        result ? [{ type: 'Dashboard', id: 'recent-activity' }] : [],
    }),
  }),
});

export const {
  useGetDashboardStatisticsQuery,
  useGetRevenueChartDataQuery,
  useGetReservationsChartDataQuery,
  useGetBookingsChartDataQuery,
  useGetPopularBathsQuery,
  useGetRecentActivityQuery,
} = dashboardApiSlice;
