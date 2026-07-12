import { z } from 'zod';
import { MaintenancePriority } from '@prisma/client';

export const CreateMaintenanceRequestSchema = z.object({
  body: z.object({
    assetId: z.string().uuid('Invalid assetId format'),
    issueDescription: z.string().min(5, 'Issue description must be at least 5 characters'),
    priority: z.nativeEnum(MaintenancePriority).default('MEDIUM'),
  }),
});

export const AssignTechnicianSchema = z.object({
  body: z.object({
    technicianName: z.string().min(2, 'Technician name must be at least 2 characters'),
  }),
});

export const ResolveMaintenanceSchema = z.object({
  body: z.object({
    resolutionNotes: z.string().min(5, 'Resolution notes must be at least 5 characters'),
  }),
});

export const MaintenanceParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid maintenance request ID format'),
  }),
});

export type CreateMaintenanceRequestInput = z.infer<typeof CreateMaintenanceRequestSchema>['body'];
export type AssignTechnicianInput = z.infer<typeof AssignTechnicianSchema>['body'];
export type ResolveMaintenanceInput = z.infer<typeof ResolveMaintenanceSchema>['body'];
