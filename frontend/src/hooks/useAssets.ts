import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Asset } from '../types/models';

interface GetAssetsParams {
  search?: string;
  category?: string;
  status?: string;
  department?: string;
  page?: number;
  limit?: number;
}

interface AssetsResponse {
  items: Asset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const useAssets = (params: GetAssetsParams) => {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: async () => {
      const response = await apiClient.get('/assets', { params });
      const { items, meta } = response.data.data;
      return {
        items,
        total: meta.total,
        page: meta.page,
        limit: meta.limit,
        totalPages: meta.totalPages,
      } as AssetsResponse;
    }
  });
};

export const useRegisterAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiClient.post('/assets', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });
};
