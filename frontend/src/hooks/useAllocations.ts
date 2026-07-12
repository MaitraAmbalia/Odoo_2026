import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface PaginatedData {
  items: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useAllocations = () => {
  return useQuery({
    queryKey: ['allocations'],
    queryFn: async (): Promise<PaginatedData> => {
      const res = await apiClient.get('/allocations');
      const data = res.data.data;
      return { items: data.items || [], total: data.total || 0, page: data.page || 1, limit: data.limit || 20, totalPages: data.totalPages || 1 };
    }
  });
};

export const useCreateAllocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { assetId: string; allocatedToUserId?: string; allocatedToDepartmentId?: string; expectedReturnDate?: string }) => {
      const res = await apiClient.post('/allocations', data);
      return res.data;
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
      const res = await apiClient.post(`/allocations/${id}/return`, { returnConditionNotes: conditionNoteIn });
      return res.data;
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
      const res = await apiClient.post(`/allocations/${data.fromAllocationId}/transfer-request`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    }
  });
};

export const useTransfers = () => {
  return useQuery({
    queryKey: ['transfers'],
    queryFn: async (): Promise<PaginatedData> => {
      const res = await apiClient.get('/transfers');
      const data = res.data.data;
      return { items: data.items || [], total: data.total || 0, page: data.page || 1, limit: data.limit || 20, totalPages: data.totalPages || 1 };
    }
  });
};

export const useApproveTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/transfers/${id}/approve`);
      return res.data;
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
      const res = await apiClient.patch(`/transfers/${id}/reject`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    }
  });
};
