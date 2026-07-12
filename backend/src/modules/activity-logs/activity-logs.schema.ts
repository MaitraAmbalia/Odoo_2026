import { z } from 'zod';

export const ListActivityLogsQuerySchema = z.object({
  query: z.object({
    actorUserId: z.string().uuid('Invalid actorUserId format').optional(),
    entityType: z.string().optional(),
    startDate: z.preprocess((val: any) => {
      if (typeof val === 'string' && val.trim() === '') return undefined;
      return val;
    }, z.coerce.date().optional()),
    endDate: z.preprocess((val: any) => {
      if (typeof val === 'string' && val.trim() === '') return undefined;
      return val;
    }, z.coerce.date().optional()),
    page: z.string().regex(/^\d+$/, 'Page must be a positive integer').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a positive integer').optional(),
  }),
});

export type ListActivityLogsQueryInput = z.infer<typeof ListActivityLogsQuerySchema>['query'];
