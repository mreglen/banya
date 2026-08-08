import { useGetBookingsQuery } from '../redux/slices/apiSlice';

export function useUnreadBookingsCount({ skip = false } = {}) {
  const { unreadCount } = useGetBookingsQuery(undefined, {
    skip,
    pollingInterval: skip ? 0 : 60000,
    selectFromResult: ({ data }) => ({
      unreadCount: (data || []).filter((booking) => !booking.is_read).length,
    }),
  });

  return unreadCount;
}

export default useUnreadBookingsCount;
