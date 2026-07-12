import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Notification } from '../types/models';

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      return [
        {
          id: 'notif-1',
          userId: 'user-1',
          type: 'ASSET_ASSIGNED',
          message: 'MacBook Pro M2 (AF-0001) has been assigned to Sarah Jenkins.',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString() // 1hr ago
        },
        {
          id: 'notif-2',
          userId: 'user-1',
          type: 'BOOKING_CONFIRMED',
          message: 'Booking confirmed for Conference Room A at 09:30 AM.',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString() // 1day ago
        }
      ] as Notification[];
      // Real API:
      // const res = await apiClient.get('/notifications');
      // return res.data.data;
    }
  });
};

export const useMarkRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Mark read:', id);
      return { success: true };
      // const res = await apiClient.patch(`/notifications/${id}/read`);
      // return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

export const useMarkAllRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      console.log('Mark all read');
      return { success: true };
      // const res = await apiClient.patch('/notifications/read-all');
      // return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};
