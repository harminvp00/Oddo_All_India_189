import { z } from "zod";

/**
 * Attendance statuses supported by the database.
 */
export const attendanceStatusSchema = z.enum([
  "PRESENT",
  "LATE",
  "ABSENT",
  "HALF_DAY",
  "CORRECTED",
]);

/**
 * POST /api/attendance/check-in
 *
 * employeeId must NOT be accepted from the client.
 * The employee is identified from the authenticated user.
 */
export const checkInSchema = z
  .object({
    attendanceDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "attendanceDate must be in YYYY-MM-DD format",
      )
      .optional(),

    checkIn: z
      .string()
      .datetime({
        message: "checkIn must be a valid ISO datetime",
      })
      .optional(),
  })
  .strict();

/**
 * POST /api/attendance/check-out
 */
export const checkOutSchema = z
  .object({
    attendanceDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "attendanceDate must be in YYYY-MM-DD format",
      )
      .optional(),

    checkOut: z
      .string()
      .datetime({
        message: "checkOut must be a valid ISO datetime",
      })
      .optional(),
  })
  .strict();

/**
 * GET /api/attendance
 */
export const attendanceListSchema = z
  .object({
    employeeId: z.coerce.bigint().positive().optional(),

    startDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "startDate must be in YYYY-MM-DD format",
      )
      .optional(),

    endDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "endDate must be in YYYY-MM-DD format",
      )
      .optional(),

    status: attendanceStatusSchema.optional(),

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
  .strict()
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate) {
      const start = new Date(`${data.startDate}T00:00:00.000Z`);
      const end = new Date(`${data.endDate}T00:00:00.000Z`);

      if (start > end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: "endDate must be greater than or equal to startDate",
        });
      }
    }
  });

/**
 * Attendance ID parameter.
 */
export const attendanceIdSchema = z.object({
  id: z.coerce.bigint().positive(),
});

/**
 * PATCH /api/attendance/:id
 *
 * HR Manager / Admin correction.
 */
export const correctionSchema = z
  .object({
    checkIn: z
      .string()
      .datetime({
        message: "checkIn must be a valid ISO datetime",
      })
      .optional(),

    checkOut: z
      .string()
      .datetime({
        message: "checkOut must be a valid ISO datetime",
      })
      .optional(),

    workedHours: z
      .number()
      .min(0, "workedHours cannot be negative")
      .optional(),

    status: attendanceStatusSchema.optional(),

    correctionNote: z
      .string()
      .trim()
      .min(1, "correctionNote cannot be empty")
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    /**
     * A CORRECTED attendance record must always have
     * a correction note.
     */
    if (
      data.status === "CORRECTED" &&
      !data.correctionNote?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correctionNote"],
        message:
          "correctionNote is required when status is CORRECTED",
      });
    }
  });

export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type AttendanceListInput = z.infer<
  typeof attendanceListSchema
>;
export type CorrectionInput = z.infer<typeof correctionSchema>;