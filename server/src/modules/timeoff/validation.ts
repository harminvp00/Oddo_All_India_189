import { z } from "zod";

export const ruleCategorySchema = z.enum([
  "BASIC",
  "ALLOWANCE",
  "GROSS",
  "DEDUCTION",
  "CONTRIBUTION",
  "NET",
]);

export const ruleMethodSchema = z.enum([
  "FIXED",
  "PERCENTAGE",
  "FORMULA",
]);

export const payrunStatusSchema = z.enum([
  "DRAFT",
  "PROCESSING",
  "COMPUTED",
  "VALIDATED",
  "PAID",
  "CANCELLED",
]);

export const payslipStatusSchema = z.enum([
  "DRAFT",
  "COMPUTED",
  "VALIDATED",
  "PAID",
  "SENT",
  "CANCELLED",
]);

const idSchema = z.coerce.bigint().positive();

const dateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be in YYYY-MM-DD format",
  );

const nullableNumber = z.number().finite().nullable().optional();

/*
|--------------------------------------------------------------------------
| Salary Rules
|--------------------------------------------------------------------------
*/

export const salaryRuleCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(100),

    code: z
      .string()
      .trim()
      .min(1)
      .max(40),

    category: ruleCategorySchema,

    method: ruleMethodSchema,

    fixedAmount: nullableNumber,

    percentage: nullableNumber,

    formula: z
      .string()
      .trim()
      .min(1)
      .nullable()
      .optional(),

    isActive: z.boolean().default(true),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.method === "FIXED") {
      if (
        data.fixedAmount === undefined ||
        data.fixedAmount === null ||
        data.fixedAmount < 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fixedAmount"],
          message: "FIXED rules require fixedAmount >= 0",
        });
      }

      if (
        data.percentage != null ||
        data.formula != null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["method"],
          message:
            "FIXED rules cannot define percentage or formula",
        });
      }
    }

    if (data.method === "PERCENTAGE") {
      if (
        data.percentage === undefined ||
        data.percentage === null ||
        data.percentage < 0 ||
        data.percentage > 100
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["percentage"],
          message:
            "PERCENTAGE rules require percentage between 0 and 100",
        });
      }

      if (
        data.fixedAmount != null ||
        data.formula != null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["method"],
          message:
            "PERCENTAGE rules cannot define fixedAmount or formula",
        });
      }
    }

    if (data.method === "FORMULA") {
      if (!data.formula?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["formula"],
          message: "FORMULA rules require formula",
        });
      }

      if (
        data.fixedAmount != null ||
        data.percentage != null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["method"],
          message:
            "FORMULA rules cannot define fixedAmount or percentage",
        });
      }
    }
  });

/*
 * IMPORTANT:
 * Do not use salaryRuleCreateSchema.partial().
 *
 * Zod v4 does not allow partial() on an object schema
 * containing refinements.
 *
 * PATCH validation is therefore defined separately.
 */
export const salaryRuleUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),

    code: z
      .string()
      .trim()
      .min(1)
      .max(40)
      .optional(),

    category: ruleCategorySchema.optional(),

    method: ruleMethodSchema.optional(),

    fixedAmount: nullableNumber,

    percentage: nullableNumber,

    formula: z
      .string()
      .trim()
      .min(1)
      .nullable()
      .optional(),

    isActive: z.boolean().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    /*
     * Validate values that are explicitly supplied.
     */

    if (
      data.fixedAmount !== undefined &&
      data.fixedAmount !== null &&
      data.fixedAmount < 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fixedAmount"],
        message: "fixedAmount must be >= 0",
      });
    }

    if (
      data.percentage !== undefined &&
      data.percentage !== null &&
      (data.percentage < 0 ||
        data.percentage > 100)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["percentage"],
        message:
          "percentage must be between 0 and 100",
      });
    }

    if (
      data.formula !== undefined &&
      data.formula !== null &&
      !data.formula.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["formula"],
        message: "formula cannot be empty",
      });
    }

    /*
     * If method is explicitly changed, ensure
     * incompatible fields are not supplied.
     *
     * The service performs the final merged
     * invariant check using the existing DB row.
     */

    if (data.method === "FIXED") {
      if (
        data.percentage != null ||
        data.formula != null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["method"],
          message:
            "FIXED rules cannot define percentage or formula",
        });
      }
    }

    if (data.method === "PERCENTAGE") {
      if (
        data.fixedAmount != null ||
        data.formula != null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["method"],
          message:
            "PERCENTAGE rules cannot define fixedAmount or formula",
        });
      }
    }

    if (data.method === "FORMULA") {
      if (
        data.fixedAmount != null ||
        data.percentage != null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["method"],
          message:
            "FORMULA rules cannot define fixedAmount or percentage",
        });
      }
    }
  });

export const salaryRuleIdSchema = z.object({
  id: idSchema,
});

export const salaryRuleListSchema = z
  .object({
    search: z.string().trim().optional(),

    category: ruleCategorySchema.optional(),

    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
  })
  .strict();

/*
|--------------------------------------------------------------------------
| Salary Structures
|--------------------------------------------------------------------------
*/

const structureRuleSchema = z
  .object({
    ruleId: idSchema,

    executionOrder: z
      .number()
      .int()
      .positive(),
  })
  .strict();

export const salaryStructureCreateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(100),

    description: z
      .string()
      .trim()
      .max(1000)
      .nullable()
      .optional(),

    isActive: z.boolean().default(true),

    rules: z
      .array(structureRuleSchema)
      .min(1),
  })
  .strict()
  .superRefine((data, ctx) => {
    const ruleIds = new Set(
      data.rules.map((rule) =>
        rule.ruleId.toString(),
      ),
    );

    if (ruleIds.size !== data.rules.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rules"],
        message:
          "A salary rule cannot be added twice",
      });
    }

    const orders = new Set(
      data.rules.map(
        (rule) => rule.executionOrder,
      ),
    );

    if (orders.size !== data.rules.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rules"],
        message:
          "executionOrder values must be unique",
      });
    }
  });

export const salaryStructureUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000)
      .nullable()
      .optional(),

    isActive: z.boolean().optional(),

    rules: z
      .array(structureRuleSchema)
      .min(1)
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!data.rules) {
      return;
    }

    const ruleIds = new Set(
      data.rules.map((rule) =>
        rule.ruleId.toString(),
      ),
    );

    const orders = new Set(
      data.rules.map(
        (rule) => rule.executionOrder,
      ),
    );

    if (
      ruleIds.size !== data.rules.length ||
      orders.size !== data.rules.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rules"],
        message:
          "Rule IDs and executionOrder values must be unique",
      });
    }
  });

export const salaryStructureIdSchema = z.object({
  id: idSchema,
});

export const salaryStructureListSchema = z
  .object({
    search: z.string().trim().optional(),

    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
  })
  .strict();

/*
|--------------------------------------------------------------------------
| Payrun / Payslip
|--------------------------------------------------------------------------
*/
 
export const payrunIdSchema = z.object({
  id: idSchema,
});

export const payslipIdSchema = z.object({
  id: idSchema,
});

export const eligibleEmployeesSchema = z
  .object({
    salaryStructureId: idSchema,

    periodStart: dateSchema,

    periodEnd: dateSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.periodStart > data.periodEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["periodEnd"],
        message:
          "periodEnd must be greater than or equal to periodStart",
      });
    }
  });

export const payrunCreateSchema = z
  .object({
    runName: z
      .string()
      .trim()
      .min(1)
      .max(120),

    salaryStructureId: idSchema,

    periodStart: dateSchema,

    periodEnd: dateSchema,

    employeeIds: z
      .array(idSchema)
      .min(1)
      .max(1000),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.periodStart > data.periodEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["periodEnd"],
        message:
          "periodEnd must be greater than or equal to periodStart",
      });
    }

    const employeeIds = new Set(
      data.employeeIds.map((id) =>
        id.toString(),
      ),
    );

    if (
      employeeIds.size !==
      data.employeeIds.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["employeeIds"],
        message:
          "employeeIds must be unique",
      });
    }
  });

export const payrunListSchema = z
  .object({
    status: payrunStatusSchema.optional(),

    salaryStructureId:
      idSchema.optional(),

    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),
  })
  .strict();

export const payslipListSchema = z
  .object({
    payrunId: idSchema.optional(),

    employeeId: idSchema.optional(),

    status: payslipStatusSchema.optional(),

    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),
  })
  .strict();

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

export type SalaryRuleCreateInput =
  z.infer<typeof salaryRuleCreateSchema>;

export type SalaryRuleUpdateInput =
  z.infer<typeof salaryRuleUpdateSchema>;

export type SalaryStructureCreateInput =
  z.infer<typeof salaryStructureCreateSchema>;

export type SalaryStructureUpdateInput =
  z.infer<typeof salaryStructureUpdateSchema>;

export type PayrunCreateInput =
  z.infer<typeof payrunCreateSchema>;