import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const dateStringSchema = z
  .string()
  .refine((val) => dateRegex.test(val) && !isNaN(Date.parse(val)), {
    message: 'Invalid date format, expected YYYY-MM-DD',
  })
  .transform((val) => new Date(val));

export const createEmployeeSchema = z.object({
  employeeCode: z
    .string()
    .min(1, 'Employee code is required')
    .max(30, 'Employee code too long')
    .trim()
    .toUpperCase(),
  firstName: z.string().min(1, 'First name is required').max(80, 'First name too long').trim(),
  lastName: z.string().min(1, 'Last name is required').max(80, 'Last name too long').trim(),
  phone: z.string().max(30, 'Phone number too long').trim().nullable().optional(),
  dateOfBirth: z
    .union([dateStringSchema, z.string().datetime()])
    .nullable()
    .optional()
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  hireDate: z
    .union([dateStringSchema, z.string().datetime()])
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  terminationDate: z
    .union([dateStringSchema, z.string().datetime()])
    .nullable()
    .optional()
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  employeeType: z
    .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY'])
    .optional()
    .default('FULL_TIME'),
  employmentStatus: z
    .enum(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'])
    .optional()
    .default('ACTIVE'),
  departmentId: z.coerce.string().nullable().optional(),
  positionId: z.coerce.string().nullable().optional(),
  managerId: z.coerce.string().nullable().optional(),
  scheduleId: z.coerce.string().nullable().optional(),
  userId: z.coerce.string().nullable().optional(),
  bankAccountName: z.string().max(120).trim().nullable().optional(),
  bankAccountNumber: z.string().max(50).trim().nullable().optional(),
  bankName: z.string().max(120).trim().nullable().optional(),
  ifscCode: z.string().max(20).trim().toUpperCase().nullable().optional(),
});

export const updateEmployeeSchema = z.object({
  employeeCode: z.string().min(1).max(30).trim().toUpperCase().optional(),
  firstName: z.string().min(1).max(80).trim().optional(),
  lastName: z.string().min(1).max(80).trim().optional(),
  phone: z.string().max(30).trim().nullable().optional(),
  dateOfBirth: z
    .union([dateStringSchema, z.string().datetime()])
    .nullable()
    .optional()
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  hireDate: z
    .union([dateStringSchema, z.string().datetime()])
    .optional()
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  terminationDate: z
    .union([dateStringSchema, z.string().datetime()])
    .nullable()
    .optional()
    .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
  employeeType: z
    .enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY'])
    .optional(),
  employmentStatus: z
    .enum(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'])
    .optional(),
  departmentId: z.coerce.string().nullable().optional(),
  positionId: z.coerce.string().nullable().optional(),
  managerId: z.coerce.string().nullable().optional(),
  scheduleId: z.coerce.string().nullable().optional(),
  userId: z.coerce.string().nullable().optional(),
  bankAccountName: z.string().max(120).trim().nullable().optional(),
  bankAccountNumber: z.string().max(50).trim().nullable().optional(),
  bankName: z.string().max(120).trim().nullable().optional(),
  ifscCode: z.string().max(20).trim().toUpperCase().nullable().optional(),
});

export const employeeFilterSchema = z.object({
  search: z.string().optional(),
  departmentId: z.coerce.string().optional(),
  positionId: z.coerce.string().optional(),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'ALL']).optional(),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY', 'ALL']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeFilterInput = z.infer<typeof employeeFilterSchema>;
