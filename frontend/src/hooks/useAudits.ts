import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { AuditCycle, AuditItem } from '../types/models';

export const useAuditCycles = () => {
  return useQuery({
    queryKey: ['audits'],
    queryFn: async () => {
      const res = await apiClient.get('/audits');
      return (res.data.data.items || []) as AuditCycle[];
    }
  });
};

export const useAuditItems = (cycleId?: string) => {
  return useQuery({
    queryKey: ['audit-items', cycleId],
    queryFn: async () => {
      const res = await apiClient.get(`/audits/${cycleId}`);
      // getCycleDetail returns a cycle object with embedded items array
      const cycleData = res.data.data;
      return (cycleData?.items || []) as AuditItem[];
    },
    enabled: !!cycleId
  });
};

export const useVerifyAuditItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cycleId, itemId, result, notes }: { cycleId: string; itemId: string; result: string; notes?: string }) => {
      const res = await apiClient.patch(`/audits/${cycleId}/items/${itemId}`, { result, notes });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['audit-items', variables.cycleId] });
    }
  });
};

export const useCloseAuditCycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cycleId: string) => {
      const res = await apiClient.post(`/audits/${cycleId}/close`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    }
  });
};

export const useCreateAuditCycle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; scopeDepartmentId?: string; scopeLocation?: string; startDate: string; endDate: string; auditorUserIds: string[] }) => {
      const res = await apiClient.post('/audits', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    }
  });
};
