import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { AuditCycle, AuditItem } from '../types/models';

export const useAuditCycles = () => {
  return useQuery({
    queryKey: ['audits'],
    queryFn: async () => {
      return [
        {
          id: 'audit-1',
          name: 'Q3 Hardware Audit - Engineering',
          scopeDepartmentId: 'dept-1',
          startDate: new Date(Date.now() - 86400000 * 2).toISOString(),
          endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
          status: 'IN_PROGRESS',
          createdById: 'user-1',
          createdAt: new Date().toISOString()
        }
      ] as any[];
      // Real API:
      // const res = await apiClient.get('/audit-cycles');
      // return res.data.data;
    }
  });
};

export const useAuditItems = (cycleId?: string) => {
  return useQuery({
    queryKey: ['audit-items', cycleId],
    queryFn: async () => {
      return [
        {
          id: 'item-1',
          auditCycleId: 'audit-1',
          assetId: '1',
          result: 'VERIFIED',
          notes: 'Asset verified in working condition.',
          asset: { id: '1', assetTag: 'AF-0001', name: 'MacBook Pro M2', location: 'HQ-1' }
        },
        {
          id: 'item-2',
          auditCycleId: 'audit-1',
          assetId: '2',
          result: 'PENDING',
          notes: '',
          asset: { id: '2', assetTag: 'AF-0002', name: 'Dell UltraSharp 27"', location: 'HQ-2' }
        }
      ] as any[];
      // Real API:
      // const res = await apiClient.get(`/audit-cycles/${cycleId}`);
      // return res.data.data.items;
    },
    enabled: !!cycleId
  });
};

export const useVerifyAuditItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cycleId, itemId, result, notes }: { cycleId: string; itemId: string; result: string; notes?: string }) => {
      console.log('Verify item:', itemId, result, notes);
      return { success: true };
      // const res = await apiClient.patch(`/audits/${cycleId}/items/${itemId}`, { result, notes });
      // return res.data;
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
      console.log('Close audit cycle:', cycleId);
      return { success: true };
      // const res = await apiClient.post(`/audits/${cycleId}/close`);
      // return res.data;
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
      console.log('Create audit cycle:', data);
      return { success: true };
      // const res = await apiClient.post('/audits', data);
      // return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    }
  });
};
