import { z } from 'zod';

export const UpdateEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    departmentId: z.string().uuid('Invalid department ID').optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});

export const PromoteEmployeeSchema = z.object({
  body: z.object({
    role: z.enum(['DEPARTMENT_HEAD', 'ASSET_MANAGER']),
  }),
});

export const ListEmployeesQuerySchema = z.object({
  query: z.object({
    department: z.string().uuid('Invalid department ID').optional(),
    role: z.enum(['ADMIN', 'DEPARTMENT_HEAD', 'ASSET_MANAGER', 'EMPLOYEE']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    page: z.string().regex(/^\d+$/, 'Page must be a positive integer').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a positive integer').optional(),
  }),
});

export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>['body'];
export type PromoteEmployeeInput = z.infer<typeof PromoteEmployeeSchema>['body'];
export type ListEmployeesQueryInput = z.infer<typeof ListEmployeesQuerySchema>['query'];
