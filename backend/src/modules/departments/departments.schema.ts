import { z } from 'zod';

export const CreateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    headUserId: z.string().uuid('Invalid head user ID').optional(),
    parentDepartmentId: z.string().uuid('Invalid parent department ID').optional(),
  }),
});

export const UpdateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    headUserId: z.string().uuid('Invalid head user ID').nullable().optional(),
    parentDepartmentId: z.string().uuid('Invalid parent department ID').nullable().optional(),
  }),
});

export const UpdateDepartmentStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE'], {
      errorMap: () => ({ message: "Status must be 'ACTIVE' or 'INACTIVE'" }),
    }),
  }),
});

export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>['body'];
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>['body'];
export type UpdateDepartmentStatusInput = z.infer<typeof UpdateDepartmentStatusSchema>['body'];
