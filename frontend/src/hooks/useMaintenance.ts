import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { MaintenanceRequest } from '../types/models';

export const useMaintenanceRequests = () => {
  return useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      return [
        {
          id: 'maint-1',
          assetId: '2',
          raisedById: 'user-3',
          issueDescription: 'Monitor keeps flickering when running at 4K resolution.',
          priority: 'MEDIUM',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          asset: { id: '2', assetTag: 'AF-0002', name: 'Dell UltraSharp 27"' },
          raisedBy: { id: 'user-3', name: 'Priya Sharma' }
        },
        {
          id: 'maint-2',
          assetId: '1',
          raisedById: 'user-2',
          issueDescription: 'Laptop battery draining in less than an hour.',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          technicianName: 'Mike Tech',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          asset: { id: '1', assetTag: 'AF-0001', name: 'MacBook Pro M2' },
          raisedBy: { id: 'user-2', name: 'Sarah Jenkins' }
        }
      ] as any[];
      // Real API:
      // const res = await apiClient.get('/maintenance-requests');
      // return res.data.data;
    }
  });
};

export const useCreateMaintenanceRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { assetId: string; issueDescription: string; priority: string }) => {
      console.log('Create maintenance request:', data);
      return { success: true };
      // const res = await apiClient.post('/maintenance-requests', data);
      // return res.data;
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
      console.log('Update maintenance request:', id, status, { technicianName, resolutionNotes });
      return { success: true };
      // let path = `/maintenance-requests/${id}/approve`;
      // if (status === 'REJECTED') path = `/maintenance-requests/${id}/reject`;
      // else if (status === 'TECHNICIAN_ASSIGNED') path = `/maintenance-requests/${id}/assign-technician`;
      // else if (status === 'IN_PROGRESS') path = `/maintenance-requests/${id}/start`;
      // else if (status === 'RESOLVED') path = `/maintenance-requests/${id}/resolve`;
      
      // const res = await apiClient.patch(path, { technicianName, resolutionNotes });
      // return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });
};
