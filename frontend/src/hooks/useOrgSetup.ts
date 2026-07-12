import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Department, User, AssetCategory } from '../types/models';

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await apiClient.get('/departments');
      return res.data.data as Department[];
    }
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; parentDepartmentId?: string | null; headUserId?: string | null }) => {
      const res = await apiClient.post('/departments', data);
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); }
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; parentDepartmentId?: string | null; headUserId?: string | null }) => {
      const res = await apiClient.patch(`/departments/${id}`, data);
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); }
  });
};

export const useUpdateDepartmentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => {
      const res = await apiClient.patch(`/departments/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); }
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/categories');
      return res.data.data as AssetCategory[];
    }
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; customFieldsSchema?: any }) => {
      const res = await apiClient.post('/categories', data);
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); }
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; customFieldsSchema?: any }) => {
      const res = await apiClient.patch(`/categories/${id}`, data);
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); }
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/categories/${id}`);
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); }
  });
};

export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await apiClient.get('/employees');
      return res.data.data.items as User[];
    }
  });
};

export const usePromoteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, role }: { employeeId: string; role: 'DEPARTMENT_HEAD' | 'ASSET_MANAGER' | 'EMPLOYEE' }) => {
      const res = await apiClient.patch(`/employees/${employeeId}/promote`, { role });
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); }
  });
};

export const useUpdateEmployeeStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, status }: { employeeId: string; status: 'ACTIVE' | 'INACTIVE' }) => {
      const res = await apiClient.patch(`/employees/${employeeId}`, { status });
      return res.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); }
  });
};
