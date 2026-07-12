import { z } from 'zod';
import { AuditItemResult } from '@prisma/client';

export const CreateAuditCycleSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Audit name must be at least 3 characters'),
    scopeDepartmentId: z.string().uuid('Invalid scopeDepartmentId format').optional(),
    scopeLocation: z.string().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    auditorUserIds: z.array(z.string().uuid('Invalid auditor user ID')).min(1, 'At least one auditor must be assigned'),
  }).refine(
    (data: any) => data.endDate > data.startDate,
    {
      message: 'endDate must be after startDate',
      path: ['endDate'],
    }
  ),
});

export const VerifyAuditItemSchema = z.object({
  body: z.object({
    result: z.enum([AuditItemResult.VERIFIED, AuditItemResult.MISSING, AuditItemResult.DAMAGED]),
    notes: z.string().optional(),
  }),
});

export const AuditParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid audit cycle ID format'),
  }),
});

export const VerifyItemParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid audit cycle ID format'),
    itemId: z.string().uuid('Invalid audit item ID format'),
  }),
});

export type CreateAuditCycleInput = z.infer<typeof CreateAuditCycleSchema>['body'];
export type VerifyAuditItemInput = z.infer<typeof VerifyAuditItemSchema>['body'];
