import { z } from 'zod';
import { paginationSchema } from '../../common/pagination';

export const GetNotificationsQuerySchema = z.object({
  query: paginationSchema.extend({
    unreadOnly: z
      .preprocess((val: any) => {
        if (val === 'true') return true;
        if (val === 'false') return false;
        return undefined;
      }, z.boolean().optional())
      .optional(),
  }),
});

export const ReadNotificationParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid notification ID format'),
  }),
});

export type GetNotificationsQueryInput = z.infer<typeof GetNotificationsQuerySchema>['query'];
export type ReadNotificationParamsInput = z.infer<typeof ReadNotificationParamsSchema>['params'];
