import { z } from 'zod';

export const ExportReportSchema = z.object({
  query: z.object({
    type: z.enum([
      'utilization',
      'maintenance-frequency',
      'due-for-maintenance',
      'department-allocation-summary',
      'booking-heatmap',
    ]),
    format: z.enum(['csv']),
  }),
});

export type ExportReportInput = z.infer<typeof ExportReportSchema>['query'];
