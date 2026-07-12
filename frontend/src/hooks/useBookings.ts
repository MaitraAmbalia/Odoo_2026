import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useBookings = (assetId?: string) => {
  return useQuery({
    queryKey: ['bookings', assetId],
    queryFn: async () => {
      const res = await apiClient.get('/bookings', { params: { assetId } });
      return (res.data.data.items || []) as any[];
    },
    enabled: !!assetId
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { assetId: string; startTime: string; endTime: string; purpose?: string }) => {
      const res = await apiClient.post('/bookings', data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', variables.assetId] });
    }
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, assetId }: { id: string; assetId: string }) => {
      const res = await apiClient.patch(`/bookings/${id}/cancel`);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', variables.assetId] });
    }
  });
};
