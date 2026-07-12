import { z } from 'zod';

export const CreateAllocationSchema = z.object({
  body: z.object({
    assetId: z.string().uuid('Invalid assetId format'),
    allocatedToUserId: z.string().uuid('Invalid allocatedToUserId format').optional(),
    allocatedToDepartmentId: z.string().uuid('Invalid allocatedToDepartmentId format').optional(),
    expectedReturnDate: z.preprocess((val) => {
      if (typeof val === 'string' && val.trim() === '') return undefined;
      return val;
    }, z.coerce.date().optional()),
    conditionNoteOut: z.string().optional(),
  }).refine(
    (data) =>
      (!!data.allocatedToUserId && !data.allocatedToDepartmentId) ||
      (!data.allocatedToUserId && !!data.allocatedToDepartmentId),
    {
      message: 'Must allocate to either a user or a department, but not both',
      path: ['allocatedToUserId'],
    }
  ),
});

export const ReturnAllocationSchema = z.object({
  body: z.object({
    returnConditionNotes: z.string().optional(),
  }),
});

export const CreateTransferRequestSchema = z.object({
  body: z.object({
    requestedToUserId: z.string().uuid('Invalid requestedToUserId format').optional(),
    requestedToDepartmentId: z.string().uuid('Invalid requestedToDepartmentId format').optional(),
  }).refine(
    (data) =>
      (!!data.requestedToUserId && !data.requestedToDepartmentId) ||
      (!data.requestedToUserId && !!data.requestedToDepartmentId),
    {
      message: 'Must request transfer to either a user or a department, but not both',
      path: ['requestedToUserId'],
    }
  ),
});

export const ResolveTransferRequestSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
  }),
});

export const AllocationParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid allocation ID format'),
  }),
});

export const TransferParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid transfer ID format'),
  }),
});

export type CreateAllocationInput = z.infer<typeof CreateAllocationSchema>['body'];
export type ReturnAllocationInput = z.infer<typeof ReturnAllocationSchema>['body'];
export type CreateTransferRequestInput = z.infer<typeof CreateTransferRequestSchema>['body'];
export type ResolveTransferRequestInput = z.infer<typeof ResolveTransferRequestSchema>['body'];
