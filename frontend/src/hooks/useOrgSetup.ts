import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Department, User, AssetCategory } from '../types/models';

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      // Mock data initially
      return [
        { id: 'dept-1', name: 'Engineering', parentDepartmentId: null, headUserId: 'user-2', status: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'dept-2', name: 'Design', parentDepartmentId: null, headUserId: null, status: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'dept-3', name: 'Frontend Eng', parentDepartmentId: 'dept-1', headUserId: 'user-3', status: 'ACTIVE', createdAt: '', updatedAt: '' },
      ] as Department[];
      // Real API:
      // const res = await apiClient.get('/departments');
      // return res.data.data;
    }
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; parentDepartmentId?: string | null; headUserId?: string | null }) => {
      console.log('Create dept:', data);
      return { success: true };
      // const res = await apiClient.post('/departments', data);
      // return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    }
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      return [
        { id: 'cat1', name: 'Laptops', description: 'Portable computers', customFieldsSchema: [{ key: 'warrantyMonths', type: 'number', label: 'Warranty (months)' }], createdAt: '' },
        { id: 'cat2', name: 'Monitors', description: 'Display screens', customFieldsSchema: [], createdAt: '' },
      ] as AssetCategory[];
      // Real API:
      // const res = await apiClient.get('/categories');
      // return res.data.data;
    }
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; customFieldsSchema?: any }) => {
      console.log('Create category:', data);
      return { success: true };
      // const res = await apiClient.post('/categories', data);
      // return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });
};

export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      return [
        { id: 'user-1', name: 'Raj Patel', email: 'raj@assetflow.com', role: 'ADMIN', departmentId: 'dept-1', status: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'user-2', name: 'Sarah Jenkins', email: 'sarah@assetflow.com', role: 'DEPARTMENT_HEAD', departmentId: 'dept-1', status: 'ACTIVE', createdAt: '', updatedAt: '' },
        { id: 'user-3', name: 'Priya Sharma', email: 'priya@assetflow.com', role: 'EMPLOYEE', departmentId: 'dept-3', status: 'ACTIVE', createdAt: '', updatedAt: '' },
      ] as User[];
      // Real API:
      // const res = await apiClient.get('/employees');
      // return res.data.data;
    }
  });
};

export const usePromoteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, role }: { employeeId: string; role: 'DEPARTMENT_HEAD' | 'ASSET_MANAGER' }) => {
      console.log('Promote employee:', employeeId, 'to', role);
      return { success: true };
      // const res = await apiClient.patch(`/employees/${employeeId}/promote`, { role });
      // return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    }
  });
};
