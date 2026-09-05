import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100, 'Department name too long').trim(),
  code: z
    .string()
    .min(1, 'Department code is required')
    .max(30, 'Department code too long')
    .trim()
    .toUpperCase(),
  isActive: z.boolean().optional().default(true),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name cannot be empty').max(100).trim().optional(),
  code: z.string().min(1, 'Department code cannot be empty').max(30).trim().toUpperCase().optional(),
  isActive: z.boolean().optional(),
});

export const departmentFilterSchema = z.object({
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

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type DepartmentFilterInput = z.infer<typeof departmentFilterSchema>;
