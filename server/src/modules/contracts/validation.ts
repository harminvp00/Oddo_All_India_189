import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const dateStringSchema = z
  .string()
  .refine((val) => dateRegex.test(val) && !isNaN(Date.parse(val)), {
    message: 'Invalid date format, expected YYYY-MM-DD',
  })
  .transform((val) => new Date(val));

export const createContractSchema = z
  .object({
    employeeId: z.coerce.string().min(1, 'Employee ID is required'),
    contractNumber: z
      .string()
      .min(1, 'Contract number is required')
      .max(40, 'Contract number too long')
      .trim()
      .toUpperCase(),
    startDate: z
      .union([dateStringSchema, z.string().datetime()])
      .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
    endDate: z
      .union([dateStringSchema, z.string().datetime()])
      .nullable()
      .optional()
      .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
    wage: z.coerce.number().positive('Wage must be greater than 0'),
    currencyCode: z.string().length(3, 'Currency code must be 3 characters (e.g. INR)').toUpperCase().default('INR'),
    salaryStructureId: z.coerce.string().min(1, 'Salary Structure ID is required'),
    departmentId: z.coerce.string().nullable().optional(),
    positionId: z.coerce.string().nullable().optional(),
    scheduleId: z.coerce.string().nullable().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED']).optional().default('DRAFT'),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date cannot occur before start date',
      path: ['endDate'],
    }
  );

export const updateContractSchema = z
  .object({
    contractNumber: z.string().min(1).max(40).trim().toUpperCase().optional(),
    startDate: z
      .union([dateStringSchema, z.string().datetime()])
      .optional()
      .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
    endDate: z
      .union([dateStringSchema, z.string().datetime()])
      .nullable()
      .optional()
      .transform((val) => (typeof val === 'string' ? new Date(val) : val)),
    wage: z.coerce.number().positive().optional(),
    currencyCode: z.string().length(3).toUpperCase().optional(),
    salaryStructureId: z.coerce.string().optional(),
    departmentId: z.coerce.string().nullable().optional(),
    positionId: z.coerce.string().nullable().optional(),
    scheduleId: z.coerce.string().nullable().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED']).optional(),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date cannot occur before start date',
      path: ['endDate'],
    }
  );

export const contractFilterSchema = z.object({
  employeeId: z.coerce.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'ALL']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type ContractFilterInput = z.infer<typeof contractFilterSchema>;
