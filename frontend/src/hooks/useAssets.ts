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
      // Temporary mock data until backend is ready
      return {
        items: [
          {
            id: '1',
            assetTag: 'AF-0001',
            name: 'MacBook Pro M2',
            categoryId: 'cat1',
            status: 'AVAILABLE',
            condition: 'GOOD',
            location: 'HQ-1',
            isBookable: true,
            registeredById: '1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: { id: 'cat1', name: 'Laptops', createdAt: '' }
          },
          {
            id: '2',
            assetTag: 'AF-0002',
            name: 'Dell UltraSharp 27"',
            categoryId: 'cat2',
            status: 'ALLOCATED',
            condition: 'GOOD',
            location: 'HQ-2',
            isBookable: false,
            registeredById: '1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: { id: 'cat2', name: 'Monitors', createdAt: '' }
          }
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1
      } as AssetsResponse;
      // Real API call:
      // const response = await apiClient.get<AssetsResponse>('/assets', { params });
      // return response.data;
    }
  });
};

export const useRegisterAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData) => {
      // Mock API call
      console.log('Registering asset with data:', Object.fromEntries(data.entries()));
      return { success: true };
      // const response = await apiClient.post('/assets', data, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // });
      // return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });
};
