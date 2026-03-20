import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

export function useUnreadNotificationCount() {
  const { data, isLoading } = useQuery<{ unread_count: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  return { unreadCount: data?.unread_count, isLoading };
}
