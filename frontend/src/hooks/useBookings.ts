import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Booking } from '../types/models';

export const useBookings = (assetId?: string) => {
  return useQuery({
    queryKey: ['bookings', assetId],
    queryFn: async () => {
      // Mock data representing solid info colored blocks
      return [
        {
          id: 'booking-1',
          assetId: '1',
          bookedById: 'user-2',
          startTime: new Date(new Date().setHours(9, 0, 0)).toISOString(),
          endTime: new Date(new Date().setHours(11, 0, 0)).toISOString(),
          status: 'UPCOMING',
          createdAt: new Date().toISOString(),
          bookedBy: { id: 'user-2', name: 'Sarah Jenkins' }
        },
        {
          id: 'booking-2',
          assetId: '1',
          bookedById: 'user-3',
          startTime: new Date(new Date().setHours(13, 0, 0)).toISOString(),
          endTime: new Date(new Date().setHours(15, 30, 0)).toISOString(),
          status: 'ONGOING',
          createdAt: new Date().toISOString(),
          bookedBy: { id: 'user-3', name: 'Priya Sharma' }
        }
      ] as any[];
      // Real API:
      // const res = await apiClient.get('/bookings', { params: { assetId } });
      // return res.data.data;
    },
    enabled: !!assetId
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { assetId: string; startTime: string; endTime: string; purpose: string }) => {
      console.log('Create booking:', data);
      
      // Simulate conflict for testing:
      const reqStart = new Date(data.startTime).getTime();
      const reqEnd = new Date(data.endTime).getTime();
      
      // Conflicting slot: 9:00 - 11:00 (booking-1)
      const conflictStart = new Date(new Date().setHours(9, 0, 0)).getTime();
      const conflictEnd = new Date(new Date().setHours(11, 0, 0)).getTime();
      
      if (reqStart < conflictEnd && reqEnd > conflictStart) {
        throw {
          response: {
            status: 409,
            data: {
              success: false,
              message: 'Slot unavailable due to conflict',
              data: { conflictStart, conflictEnd, conflictUser: 'Sarah Jenkins' }
            }
          }
        };
      }
      
      return { success: true };
      // const res = await apiClient.post('/bookings', data);
      // return res.data;
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
      console.log('Cancel booking:', id);
      return { success: true };
      // const res = await apiClient.patch(`/bookings/${id}/cancel`);
      // return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', variables.assetId] });
    }
  });
};
