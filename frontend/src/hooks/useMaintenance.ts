import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { MaintenanceRequest } from '../types/models';

export const useMaintenanceRequests = () => {
  return useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const res = await apiClient.get('/maintenance');
      return (res.data.data.items || []) as any[];
    }
  });
};

export const useCreateMaintenanceRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { assetId: string; issueDescription: string; priority: string }) => {
      // Backend uses multer for this endpoint, so we must send multipart/form-data
      const formData = new FormData();
      formData.append('assetId', data.assetId);
      formData.append('issueDescription', data.issueDescription);
      formData.append('priority', data.priority);
      const res = await apiClient.post('/maintenance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    }
  });
};

export const useUpdateMaintenanceStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, technicianName, resolutionNotes }: { id: string; status: string; technicianName?: string; resolutionNotes?: string }) => {
      let path = `/maintenance/${id}/approve`;
      let body: any = {};
      if (status === 'REJECTED') {
        path = `/maintenance/${id}/reject`;
      } else if (status === 'TECHNICIAN_ASSIGNED') {
        path = `/maintenance/${id}/assign-technician`;
        body = { technicianName };
      } else if (status === 'IN_PROGRESS') {
        path = `/maintenance/${id}/start`;
      } else if (status === 'RESOLVED') {
        path = `/maintenance/${id}/resolve`;
        body = { resolutionNotes };
      }
      
      const res = await apiClient.patch(path, body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });
};
