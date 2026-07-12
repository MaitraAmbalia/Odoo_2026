import { z } from 'zod';

export const CreateAssetSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    categoryId: z.string().uuid('Invalid category ID'),
    serialNumber: z.string().optional().nullable(),
    acquisitionDate: z.preprocess((val: any) => {
      if (typeof val === 'string' && val.trim() === '') return undefined;
      return val;
    }, z.coerce.date().optional().nullable()),
    acquisitionCost: z.preprocess((val: any) => {
      if (typeof val === 'string' && val.trim() === '') return undefined;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(val);
      return val;
    }, z.number().nonnegative('Acquisition cost must be positive').optional().nullable()),
    condition: z.enum(['GOOD', 'FAIR', 'POOR']).optional(),
    location: z.string().optional().nullable(),
    isBookable: z.preprocess((val: any) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional().default(false)),
    customFieldValues: z.preprocess((val: any) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
    }, z.record(z.string(), z.any()).optional().nullable()),
  }),
});

export const UpdateAssetSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    serialNumber: z.string().optional().nullable(),
    acquisitionDate: z.preprocess((val: any) => {
      if (typeof val === 'string' && val.trim() === '') return undefined;
      return val;
    }, z.coerce.date().optional().nullable()),
    acquisitionCost: z.preprocess((val: any) => {
      if (typeof val === 'string' && val.trim() === '') return undefined;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(val);
      return val;
    }, z.number().nonnegative('Acquisition cost must be positive').optional().nullable()),
    condition: z.enum(['GOOD', 'FAIR', 'POOR']).optional(),
    location: z.string().optional().nullable(),
    isBookable: z.preprocess((val: any) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
    customFieldValues: z.preprocess((val: any) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
    }, z.record(z.string(), z.any()).optional().nullable()),
  }),
});

export const UpdateAssetStatusSchema = z.object({
  body: z.object({
    status: z.enum(['AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED']),
  }),
});

export const ListAssetsQuerySchema = z.object({
  query: z.object({
    tag: z.string().optional(),
    serial: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(['AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED']).optional(),
    department: z.string().uuid('Invalid department ID').optional(),
    location: z.string().optional(),
    page: z.string().regex(/^\d+$/, 'Page must be a positive integer').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a positive integer').optional(),
  }),
});

export type CreateAssetInput = z.infer<typeof CreateAssetSchema>['body'];
export type UpdateAssetInput = z.infer<typeof UpdateAssetSchema>['body'];
export type UpdateAssetStatusInput = z.infer<typeof UpdateAssetStatusSchema>['body'];
export type ListAssetsQueryInput = z.infer<typeof ListAssetsQuerySchema>['query'];
