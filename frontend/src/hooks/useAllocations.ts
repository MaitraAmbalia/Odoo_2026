import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { AssetAllocation, AssetTransferRequest } from '../types/models';

export const useAllocations = () => {
  return useQuery({
    queryKey: ['allocations'],
    queryFn: async () => {
      return [
        { 
          id: 'alloc-1', 
          assetId: '1', 
          allocatedToUserId: 'user-2', 
          allocatedById: 'user-1', 
          expectedReturnDate: new Date(Date.now() + 86400000 * 5).toISOString(),
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          asset: { id: '1', assetTag: 'AF-0001', name: 'MacBook Pro M2', status: 'ALLOCATED', condition: 'GOOD' }
        }
      ] as any[];
      // Real API:
      // const res = await apiClient.get('/allocations');
      // return res.data.data;
    }
  });
};

export const useCreateAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { assetId: string; allocatedToUserId?: string; allocatedToDepartmentId?: string; expectedReturnDate?: string }) => {
      // Mock double allocation validation: if assetId is 2, let's pretend it's allocated
      if (data.assetId === '2') {
        throw {
          response: {
            status: 409,
            data: {
              success: false,
              message: 'Asset is currently allocated',
              data: { currentHolder: 'Priya Sharma', currentHolderId: 'user-3', department: 'Frontend Eng', suggestTransfer: true }
            }
          }
        };
      }
      console.log('Create allocation:', data);
      return { success: true };
      // const res = await apiClient.post('/allocations', data);
      // return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });
};

export const useReturnAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, conditionNoteIn }: { id: string; conditionNoteIn?: string }) => {
      console.log('Return allocation:', id, conditionNoteIn);
      return { success: true };
      // const res = await apiClient.post(`/allocations/${id}/return`, { conditionNoteIn });
      // return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });
};

export const useCreateTransferRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { assetId: string; fromAllocationId: string; requestedToUserId?: string; requestedToDepartmentId?: string; notes?: string }) => {
      console.log('Create transfer request:', data);
      return { success: true };
      // const res = await apiClient.post(`/allocations/${data.fromAllocationId}/transfer-request`, data);
      // return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    }
  });
};

export const useTransfers = () => {
  return useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      return [
        {
          id: 'transfer-1',
          assetId: '2',
          fromAllocationId: 'alloc-1',
          requestedById: 'user-3',
          requestedToUserId: 'user-2',
          requiresAssetManagerApproval: true,
          status: 'REQUESTED',
          notes: 'Transfer Laptop for cross-team project',
          requestedAt: new Date().toISOString(),
          asset: { id: '2', assetTag: 'AF-0002', name: 'Dell UltraSharp 27"', status: 'ALLOCATED' },
          requestedBy: { id: 'user-3', name: 'Priya Sharma' }
        }
      ] as any[];
      // Real API:
      // const res = await apiClient.get('/transfers');
      // return res.data.data;
    }
  });
};

export const useApproveTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Approve transfer:', id);
      return { success: true };
      // const res = await apiClient.patch(`/transfers/${id}/approve`);
      // return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });
};

export const useRejectTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Reject transfer:', id);
      return { success: true };
      // const res = await apiClient.patch(`/transfers/${id}/reject`);
      // return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    }
  });
};
