import { z } from "zod";

export const employeeTypeEnum = z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "TEMPORARY"]);
export const employmentStatusEnum = z.enum(["ACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED"]);

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1).max(30).optional(),
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().min(1, "Last name is required").max(80),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().max(30).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  hireDate: z.string().min(1, "Hire date is required"),
  employeeType: employeeTypeEnum.default("FULL_TIME"),
  employmentStatus: employmentStatusEnum.default("ACTIVE"),
  departmentId: z.union([z.string(), z.number()]).optional().nullable(),
  positionId: z.union([z.string(), z.number()]).optional().nullable(),
  managerId: z.union([z.string(), z.number()]).optional().nullable(),
  scheduleId: z.union([z.string(), z.number()]).optional().nullable(),
  bankAccountName: z.string().max(120).optional().nullable(),
  bankAccountNumber: z.string().max(50).optional().nullable(),
  bankName: z.string().max(120).optional().nullable(),
  ifscCode: z.string().max(20).optional().nullable(),
});

export const updateEmployeeSchema = z.object({
  employeeCode: z.string().min(1).max(30).optional(),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  hireDate: z.string().optional(),
  terminationDate: z.string().optional().nullable(),
  employeeType: employeeTypeEnum.optional(),
  employmentStatus: employmentStatusEnum.optional(),
  departmentId: z.union([z.string(), z.number()]).optional().nullable(),
  positionId: z.union([z.string(), z.number()]).optional().nullable(),
  managerId: z.union([z.string(), z.number()]).optional().nullable(),
  scheduleId: z.union([z.string(), z.number()]).optional().nullable(),
  bankAccountName: z.string().max(120).optional().nullable(),
  bankAccountNumber: z.string().max(50).optional().nullable(),
  bankName: z.string().max(120).optional().nullable(),
  ifscCode: z.string().max(20).optional().nullable(),
});

export const employeeQuerySchema = z.object({
  search: z.string().optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const employeeIdSchema = z.object({
  id: z.string().min(1, "Employee ID is required"),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeQueryInput = z.infer<typeof employeeQuerySchema>;
