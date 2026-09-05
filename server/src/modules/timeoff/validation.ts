import { z } from "zod";

export const leaveUnitSchema = z.enum(["DAY", "HOUR"]);

export const allocationStatusSchema = z.enum([
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
]);

export const leaveRequestStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const idSchema = z.coerce.bigint().positive();

const positiveUnitsSchema = z
  .number()
  .positive("Units must be greater than 0");

const nonNegativeUnitsSchema = z
  .number()
  .min(0, "Units cannot be negative");

export const leaveTypeCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    code: z.string().trim().min(1).max(30),
    unit: leaveUnitSchema.default("DAY"),
    requiresAllocation: z.boolean().default(true),
    requiresApproval: z.boolean().default(true),
    payrollDeductible: z.boolean().default(false),
    maxConsecutiveUnits: z
      .number()
      .positive()
      .nullable()
      .optional(),
    isActive: z.boolean().default(true),
  })
  .strict();

export const leaveTypeUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    code: z.string().trim().min(1).max(30).optional(),
    unit: leaveUnitSchema.optional(),
    requiresAllocation: z.boolean().optional(),
    requiresApproval: z.boolean().optional(),
    payrollDeductible: z.boolean().optional(),
    maxConsecutiveUnits: z
      .number()
      .positive()
      .nullable()
      .optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const leaveTypeIdSchema = z.object({
  id: idSchema,
});

export const leaveTypeListSchema = z
  .object({
    search: z.string().trim().optional(),
    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
  })
  .strict();

export const allocationCreateSchema = z
  .object({
    employeeId: idSchema,
    leaveTypeId: idSchema,
    validFrom: dateSchema,
    validTo: dateSchema,
    allocatedUnits: nonNegativeUnitsSchema,
    status: allocationStatusSchema.default("DRAFT"),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.validFrom > data.validTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["validTo"],
        message: "validTo must be greater than or equal to validFrom",
      });
    }

    if (
      data.status === "REJECTED" ||
      data.status === "EXPIRED"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message: "New allocations cannot start as REJECTED or EXPIRED",
      });
    }
  });

export const allocationUpdateSchema = z
  .object({
    validFrom: dateSchema.optional(),
    validTo: dateSchema.optional(),
    allocatedUnits: nonNegativeUnitsSchema.optional(),
    status: allocationStatusSchema.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.validFrom && data.validTo && data.validFrom > data.validTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["validTo"],
        message: "validTo must be greater than or equal to validFrom",
      });
    }
  });

export const allocationIdSchema = z.object({
  id: idSchema,
});

export const allocationListSchema = z
  .object({
    employeeId: idSchema.optional(),
    leaveTypeId: idSchema.optional(),
    status: allocationStatusSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const leaveRequestCreateSchema = z
  .object({
    leaveTypeId: idSchema,
    startDate: dateSchema,
    endDate: dateSchema,
    requestedUnits: positiveUnitsSchema,
    reason: z.string().trim().max(1000).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.startDate > data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "endDate must be greater than or equal to startDate",
      });
    }
  });

export const leaveRequestListSchema = z
  .object({
    employeeId: idSchema.optional(),
    status: leaveRequestStatusSchema.optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "endDate must be greater than or equal to startDate",
      });
    }
  });

export const leaveRequestIdSchema = z.object({
  id: idSchema,
});

export type LeaveTypeCreateInput = z.infer<typeof leaveTypeCreateSchema>;
export type LeaveTypeUpdateInput = z.infer<typeof leaveTypeUpdateSchema>;
export type AllocationCreateInput = z.infer<typeof allocationCreateSchema>;
export type AllocationUpdateInput = z.infer<typeof allocationUpdateSchema>;
export type LeaveRequestCreateInput = z.infer<typeof leaveRequestCreateSchema>;
export type AllocationListInput = z.infer<typeof allocationListSchema>;
export type LeaveRequestListInput = z.infer<typeof leaveRequestListSchema>;
