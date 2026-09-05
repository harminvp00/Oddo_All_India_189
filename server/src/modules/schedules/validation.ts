import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

export const scheduleDaySchema = z
  .object({
    dayOfWeek: z.number().int().min(1, 'Day of week must be between 1 and 7').max(7),
    startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm format (e.g. 09:00)').nullable().optional(),
    endTime: z.string().regex(timeRegex, 'End time must be in HH:mm format (e.g. 18:00)').nullable().optional(),
    breakMinutes: z.number().int().min(0, 'Break minutes cannot be negative').default(0),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        const [startH, startM] = data.startTime.split(':').map(Number);
        const [endH, endM] = data.endTime.split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        if (endTotal <= startTotal) {
          return false;
        }

        const workMinutes = endTotal - startTotal;
        if (data.breakMinutes >= workMinutes) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'End time must be after start time, and break minutes must be less than the total time interval',
      path: ['endTime'],
    }
  );

export const createWorkingScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required').max(100, 'Name too long').trim(),
  scheduleType: z.enum(['FIXED', 'FLEXIBLE']).optional().default('FIXED'),
  isActive: z.boolean().optional().default(true),
  scheduleDays: z
    .array(scheduleDaySchema)
    .min(1, 'Schedule must contain at least one working day')
    .refine(
      (days) => {
        const set = new Set(days.map((d) => d.dayOfWeek));
        return set.size === days.length;
      },
      {
        message: 'Duplicate days of the week are not allowed in the same schedule',
        path: ['scheduleDays'],
      }
    ),
});

export const updateWorkingScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name cannot be empty').max(100).trim().optional(),
  scheduleType: z.enum(['FIXED', 'FLEXIBLE']).optional(),
  isActive: z.boolean().optional(),
  scheduleDays: z
    .array(scheduleDaySchema)
    .min(1, 'Schedule must contain at least one working day')
    .refine(
      (days) => {
        const set = new Set(days.map((d) => d.dayOfWeek));
        return set.size === days.length;
      },
      {
        message: 'Duplicate days of the week are not allowed in the same schedule',
        path: ['scheduleDays'],
      }
    )
    .optional(),
});

export const workingScheduleFilterSchema = z.object({
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

export type ScheduleDayInput = z.infer<typeof scheduleDaySchema>;
export type CreateWorkingScheduleInput = z.infer<typeof createWorkingScheduleSchema>;
export type UpdateWorkingScheduleInput = z.infer<typeof updateWorkingScheduleSchema>;
export type WorkingScheduleFilterInput = z.infer<typeof workingScheduleFilterSchema>;
