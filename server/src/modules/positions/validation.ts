import { z } from 'zod';

export const createJobPositionSchema = z.object({
  title: z.string().min(1, 'Job position title is required').max(120, 'Title too long').trim(),
  description: z.string().max(500, 'Description too long').trim().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateJobPositionSchema = z.object({
  title: z.string().min(1, 'Job position title cannot be empty').max(120).trim().optional(),
  description: z.string().max(500).trim().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const jobPositionFilterSchema = z.object({
  search: z.string().optional(),
  isActive: z
    .enum(['true', 'false', 'all'])
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateJobPositionInput = z.infer<typeof createJobPositionSchema>;
export type UpdateJobPositionInput = z.infer<typeof updateJobPositionSchema>;
export type JobPositionFilterInput = z.infer<typeof jobPositionFilterSchema>;
