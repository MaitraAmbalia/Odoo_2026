import { z } from 'zod';

/**
 * Parses pagination query params into standardized values.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Calculates skip value for Prisma queries.
 */
export function getSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}
