import { z } from "zod";

const idSchema = z.coerce.bigint().positive();

const dateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be YYYY-MM-DD",
  );

const ruleFields = {
  name: z.string().min(1).max(100),
  code: z
    .string()
    .min(1)
    .max(40)
    .regex(
      /^[A-Za-z0-9_]+$/,
      "Code can contain only letters, numbers and underscore",
    ),
  category: z.enum([
    "BASIC",
    "ALLOWANCE",
    "GROSS",
    "DEDUCTION",
    "CONTRIBUTION",
    "NET",
  ]),
  method: z.enum([
    "FIXED",
    "PERCENTAGE",
    "FORMULA",
  ]),
  fixedAmount: z.number().nonnegative().optional(),
  percentage: z.number().min(0).max(100).optional(),
  formula: z.string().trim().min(1).optional(),
  isActive: z.boolean().default(true),
};

export const salaryRuleCreateSchema = z
  .object(ruleFields)
  .superRefine((value, ctx) => {
    if (
      value.method === "FIXED" &&
      value.fixedAmount === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["fixedAmount"],
        message:
          "fixedAmount is required for FIXED rules",
      });
    }

    if (
      value.method === "PERCENTAGE" &&
      value.percentage === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["percentage"],
        message:
          "percentage is required for PERCENTAGE rules",
      });
    }

    if (
      value.method === "FORMULA" &&
      !value.formula
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["formula"],
        message:
          "formula is required for FORMULA rules",
      });
    }

    if (
      value.method !== "FIXED" &&
      value.fixedAmount !== undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["fixedAmount"],
        message:
          "fixedAmount is only valid for FIXED rules",
      });
    }

    if (
      value.method !== "PERCENTAGE" &&
      value.percentage !== undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["percentage"],
        message:
          "percentage is only valid for PERCENTAGE rules",
      });
    }

    if (
      value.method !== "FORMULA" &&
      value.formula !== undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["formula"],
        message:
          "formula is only valid for FORMULA rules",
      });
    }
  });

/*
 * IMPORTANT:
 * Do NOT use salaryRuleCreateSchema.partial().
 *
 * Zod v4 does not allow partial() on a schema
 * containing refinements.
 */
export const salaryRuleUpdateSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),

    code: z
      .string()
      .min(1)
      .max(40)
      .regex(
        /^[A-Za-z0-9_]+$/,
      )
      .optional(),

    category: z
      .enum([
        "BASIC",
        "ALLOWANCE",
        "GROSS",
        "DEDUCTION",
        "CONTRIBUTION",
        "NET",
      ])
      .optional(),

    method: z
      .enum([
        "FIXED",
        "PERCENTAGE",
        "FORMULA",
      ])
      .optional(),

    fixedAmount:
      z.number().nonnegative().nullable().optional(),

    percentage:
      z.number().min(0).max(100).nullable().optional(),

    formula:
      z.string().trim().min(1).nullable().optional(),

    isActive: z.boolean().optional(),
  })
  .strict();

const structureRuleSchema = z.object({
  ruleId: idSchema,
  executionOrder: z.number().int().positive(),
});

export const salaryStructureCreateSchema = z
  .object({
    name: z.string().min(1).max(100),

    description:
      z.string().max(500).nullable().optional(),

    isActive: z.boolean().default(true),

    rules: z
      .array(structureRuleSchema)
      .min(1),
  })
  .superRefine((value, ctx) => {
    const ruleIds = value.rules.map(
      (rule) => rule.ruleId.toString(),
    );

    const orders = value.rules.map(
      (rule) => rule.executionOrder,
    );

    if (
      new Set(ruleIds).size !==
      ruleIds.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["rules"],
        message:
          "Duplicate ruleId is not allowed",
      });
    }

    if (
      new Set(orders).size !==
      orders.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["rules"],
        message:
          "Duplicate executionOrder is not allowed",
      });
    }
  });

/*
 * Independently defined because the create schema
 * contains superRefine().
 */
export const salaryStructureUpdateSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),

    description:
      z.string().max(500).nullable().optional(),

    isActive: z.boolean().optional(),

    rules: z
      .array(structureRuleSchema)
      .min(1)
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.rules) return;

    const ruleIds = value.rules.map(
      (rule) => rule.ruleId.toString(),
    );

    const orders = value.rules.map(
      (rule) => rule.executionOrder,
    );

    if (
      new Set(ruleIds).size !==
      ruleIds.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["rules"],
        message:
          "Duplicate ruleId is not allowed",
      });
    }

    if (
      new Set(orders).size !==
      orders.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["rules"],
        message:
          "Duplicate executionOrder is not allowed",
      });
    }
  });

export const payrunCreateSchema = z
  .object({
    runName: z.string().min(1).max(120),

    salaryStructureId: idSchema,

    periodStart: dateSchema,

    periodEnd: dateSchema,

    employeeIds: z
      .array(idSchema)
      .min(1),
  })
  .superRefine((value, ctx) => {
    if (
      value.periodEnd <
      value.periodStart
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["periodEnd"],
        message:
          "periodEnd must be on or after periodStart",
      });
    }

    const employeeIds =
      value.employeeIds.map(String);

    if (
      new Set(employeeIds).size !==
      employeeIds.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["employeeIds"],
        message:
          "Duplicate employeeId is not allowed",
      });
    }
  });

export type SalaryRuleCreateInput =
  z.infer<
    typeof salaryRuleCreateSchema
  >;

export type SalaryRuleUpdateInput =
  z.infer<
    typeof salaryRuleUpdateSchema
  >;

export type SalaryStructureCreateInput =
  z.infer<
    typeof salaryStructureCreateSchema
  >;

export type SalaryStructureUpdateInput =
  z.infer<
    typeof salaryStructureUpdateSchema
  >;

export type PayrunCreateInput =
  z.infer<
    typeof payrunCreateSchema
  >;