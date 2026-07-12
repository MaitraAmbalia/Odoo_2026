import { z } from 'zod';

export const CreateBookingSchema = z.object({
  body: z.object({
    assetId: z.string().uuid('Invalid assetId format'),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    departmentId: z.string().uuid('Invalid departmentId format').optional(),
  }).refine(
    (data) => data.endTime > data.startTime,
    {
      message: 'endTime must be after startTime',
      path: ['endTime'],
    }
  ),
});

export const RescheduleBookingSchema = z.object({
  body: z.object({
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  }).refine(
    (data) => data.endTime > data.startTime,
    {
      message: 'endTime must be after startTime',
      path: ['endTime'],
    }
  ),
});

export const CancelBookingSchema = z.object({
  body: z.object({
    cancelReason: z.string().optional(),
  }),
});

export const BookingParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid booking ID format'),
  }),
});

export const AssetCalendarParamsSchema = z.object({
  params: z.object({
    assetId: z.string().uuid('Invalid asset ID format'),
  }),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>['body'];
export type RescheduleBookingInput = z.infer<typeof RescheduleBookingSchema>['body'];
export type CancelBookingInput = z.infer<typeof CancelBookingSchema>['body'];
