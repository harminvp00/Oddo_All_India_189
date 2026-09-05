import { z } from "zod";

const employeeTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "TEMPORARY"] as const;

export const payrollDashboardQuerySchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "period must be YYYY-MM").optional(),
  departmentId: z.string().regex(/^[1-9]\d*$/, "departmentId must be a positive integer").optional(),
  employeeType: z.enum(employeeTypes).optional(),
}).strict();

export type PayrollDashboardQuery = z.infer<typeof payrollDashboardQuerySchema>;
