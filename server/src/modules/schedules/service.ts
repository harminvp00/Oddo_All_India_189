import { WorkingScheduleRepository, ScheduleDayDbInput } from './repository';
import {
  CreateWorkingScheduleInput,
  UpdateWorkingScheduleInput,
  WorkingScheduleFilterInput,
  ScheduleDayInput,
} from './validation';

function timeStringToDate(timeStr?: string | null): Date | null {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  // Use a fixed epoch reference date for @db.Time(6)
  const d = new Date(Date.UTC(1970, 0, 1, parseInt(parts[0], 10), parseInt(parts[1], 10), 0));
  return d;
}

function dateToTimeString(date?: Date | null): string | null {
  if (!date) return null;
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function calculateDayHours(startTime?: string | null, endTime?: string | null, breakMinutes: number = 0): number {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const totalStartMinutes = startH * 60 + startM;
  const totalEndMinutes = endH * 60 + endM;

  const netMinutes = totalEndMinutes - totalStartMinutes - breakMinutes;
  if (netMinutes <= 0) return 0;

  return Number((netMinutes / 60).toFixed(2));
}

export function computeWeeklyHours(days: ScheduleDayInput[]): number {
  let totalHours = 0;
  for (const day of days) {
    totalHours += calculateDayHours(day.startTime, day.endTime, day.breakMinutes);
  }
  return Number(totalHours.toFixed(2));
}

export class WorkingScheduleService {
  static async listSchedules(filters: WorkingScheduleFilterInput) {
    const { page = 1, limit = 20 } = filters;
    const { total, items } = await WorkingScheduleRepository.findMany(filters);

    const formatted = items.map((sched: any) => ({
      id: sched.id.toString(),
      name: sched.name,
      scheduleType: sched.schedule_type,
      weeklyHours: Number(sched.weekly_hours),
      isActive: sched.is_active,
      employeeCount: sched._count.employees,
      contractCount: sched._count.contracts,
      dayCount: sched._count.schedule_days,
    }));

    return {
      items: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getScheduleById(id: bigint) {
    const schedule = await WorkingScheduleRepository.findById(id);

    if (!schedule) {
      return null;
    }

    const formattedDays = schedule.schedule_days.map((d: any) => {
      const startTimeStr = dateToTimeString(d.start_time);
      const endTimeStr = dateToTimeString(d.end_time);
      const dayHours = calculateDayHours(startTimeStr, endTimeStr, d.break_minutes);

      return {
        id: d.id.toString(),
        dayOfWeek: d.day_of_week,
        startTime: startTimeStr,
        endTime: endTimeStr,
        breakMinutes: d.break_minutes,
        dayHours,
      };
    });

    return {
      id: schedule.id.toString(),
      name: schedule.name,
      scheduleType: schedule.schedule_type,
      weeklyHours: Number(schedule.weekly_hours),
      isActive: schedule.is_active,
      employeeCount: schedule._count.employees,
      contractCount: schedule._count.contracts,
      scheduleDays: formattedDays,
    };
  }

  static async createSchedule(input: CreateWorkingScheduleInput) {
    const existing = await WorkingScheduleRepository.findByName(input.name);

    if (existing) {
      const error = new Error('Working schedule with this name already exists');
      (error as any).code = 'DUPLICATE_RESOURCE';
      throw error;
    }

    // Calculate weeklyHours strictly on the server
    const weeklyHours = computeWeeklyHours(input.scheduleDays);

    const dbDays: ScheduleDayDbInput[] = input.scheduleDays.map((d) => ({
      day_of_week: d.dayOfWeek,
      start_time: timeStringToDate(d.startTime),
      end_time: timeStringToDate(d.endTime),
      break_minutes: d.breakMinutes,
    }));

    const created = await WorkingScheduleRepository.create(
      {
        name: input.name,
        schedule_type: input.scheduleType ?? 'FIXED',
        weekly_hours: weeklyHours,
        is_active: input.isActive ?? true,
      },
      dbDays
    );

    if (!created) {
      const error = new Error('Failed to create working schedule');
      (error as any).code = 'INTERNAL_SERVER_ERROR';
      throw error;
    }

    const formattedDays = created.schedule_days.map((d: any) => ({
      id: d.id.toString(),
      dayOfWeek: d.day_of_week,
      startTime: dateToTimeString(d.start_time),
      endTime: dateToTimeString(d.end_time),
      breakMinutes: d.break_minutes,
      dayHours: calculateDayHours(
        dateToTimeString(d.start_time),
        dateToTimeString(d.end_time),
        d.break_minutes
      ),
    }));

    return {
      id: created.id.toString(),
      name: created.name,
      scheduleType: created.schedule_type,
      weeklyHours: Number(created.weekly_hours),
      isActive: created.is_active,
      scheduleDays: formattedDays,
    };
  }

  static async updateSchedule(id: bigint, input: UpdateWorkingScheduleInput) {
    const existing = await WorkingScheduleRepository.findById(id);

    if (!existing) {
      const error = new Error('Working schedule not found');
      (error as any).code = 'NOT_FOUND';
      throw error;
    }

    if (input.name) {
      const conflict = await WorkingScheduleRepository.findByName(input.name, id);
      if (conflict) {
        const error = new Error('Another working schedule with this name already exists');
        (error as any).code = 'DUPLICATE_RESOURCE';
        throw error;
      }
    }

    let weeklyHours: number | undefined;
    let dbDays: ScheduleDayDbInput[] | undefined;

    if (input.scheduleDays !== undefined) {
      // Recalculate weekly hours on server
      weeklyHours = computeWeeklyHours(input.scheduleDays);
      dbDays = input.scheduleDays.map((d) => ({
        day_of_week: d.dayOfWeek,
        start_time: timeStringToDate(d.startTime),
        end_time: timeStringToDate(d.endTime),
        break_minutes: d.breakMinutes,
      }));
    }

    const updated = await WorkingScheduleRepository.update(
      id,
      {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.scheduleType !== undefined ? { schedule_type: input.scheduleType } : {}),
        ...(weeklyHours !== undefined ? { weekly_hours: weeklyHours } : {}),
        ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
      },
      dbDays
    );

    if (!updated) {
      const error = new Error('Failed to update working schedule');
      (error as any).code = 'INTERNAL_SERVER_ERROR';
      throw error;
    }

    const formattedDays = updated.schedule_days.map((d: any) => ({
      id: d.id.toString(),
      dayOfWeek: d.day_of_week,
      startTime: dateToTimeString(d.start_time),
      endTime: dateToTimeString(d.end_time),
      breakMinutes: d.break_minutes,
      dayHours: calculateDayHours(
        dateToTimeString(d.start_time),
        dateToTimeString(d.end_time),
        d.break_minutes
      ),
    }));

    return {
      id: updated.id.toString(),
      name: updated.name,
      scheduleType: updated.schedule_type,
      weeklyHours: Number(updated.weekly_hours),
      isActive: updated.is_active,
      scheduleDays: formattedDays,
    };
  }

  static async deleteSchedule(id: bigint) {
    const existing = await WorkingScheduleRepository.findById(id);

    if (!existing) {
      const error = new Error('Working schedule not found');
      (error as any).code = 'NOT_FOUND';
      throw error;
    }

    const hasRelations = existing._count.employees > 0 || existing._count.contracts > 0;

    if (hasRelations) {
      const deactivated = await WorkingScheduleRepository.update(id, {
        is_active: false,
      });

      return {
        id: deactivated?.id.toString() ?? id.toString(),
        name: deactivated?.name ?? existing.name,
        isActive: false,
        action: 'DEACTIVATED',
        message: 'Working schedule has linked employees or contracts and was deactivated instead of deleted.',
      };
    }

    await WorkingScheduleRepository.delete(id);

    return {
      id: id.toString(),
      action: 'DELETED',
      message: 'Working schedule deleted successfully.',
    };
  }
}
