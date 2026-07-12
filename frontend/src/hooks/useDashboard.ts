import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useDashboardKPIs = () => {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/kpis');
      return res.data.data;
    }
  });
};

export const useDashboardOverdue = () => {
  return useQuery({
    queryKey: ['dashboard', 'overdue'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/overdue');
      return res.data.data;
    }
  });
};

export const useDashboardRecentActivity = () => {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/recent-activity');
      return res.data.data;
    }
  });
};
