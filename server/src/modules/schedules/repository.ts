import prisma from '../../config/database';
import { Prisma } from '../../generated/prisma/client';

export interface WorkingScheduleFilterQuery {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ScheduleDayDbInput {
  day_of_week: number;
  start_time: Date | null;
  end_time: Date | null;
  break_minutes: number;
}

export class WorkingScheduleRepository {
  static async findMany(filters: WorkingScheduleFilterQuery) {
    const { search, isActive, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.working_schedulesWhereInput = {};

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [total, items] = await Promise.all([
      prisma.working_schedules.count({ where }),
      prisma.working_schedules.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              employees: true,
              contracts: true,
              schedule_days: true,
            },
          },
        },
      }),
    ]);

    return { total, items };
  }

  static async findById(id: bigint) {
    return prisma.working_schedules.findUnique({
      where: { id },
      include: {
        schedule_days: {
          orderBy: { day_of_week: 'asc' },
        },
        _count: {
          select: {
            employees: true,
            contracts: true,
          },
        },
      },
    });
  }

  static async findByName(name: string, excludeId?: bigint) {
    return prisma.working_schedules.findFirst({
      where: {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        name: { equals: name, mode: 'insensitive' },
      },
    });
  }

  static async create(
    data: {
      name: string;
      schedule_type: 'FIXED' | 'FLEXIBLE';
      weekly_hours: number;
      is_active: boolean;
    },
    days: ScheduleDayDbInput[]
  ) {
    return prisma.$transaction(async (tx) => {
      const schedule = await tx.working_schedules.create({
        data: {
          name: data.name,
          schedule_type: data.schedule_type,
          weekly_hours: new Prisma.Decimal(data.weekly_hours),
          is_active: data.is_active,
        },
      });

      if (days.length > 0) {
        await tx.schedule_days.createMany({
          data: days.map((d) => ({
            schedule_id: schedule.id,
            day_of_week: d.day_of_week,
            start_time: d.start_time,
            end_time: d.end_time,
            break_minutes: d.break_minutes,
          })),
        });
      }

      return tx.working_schedules.findUnique({
        where: { id: schedule.id },
        include: {
          schedule_days: {
            orderBy: { day_of_week: 'asc' },
          },
          _count: {
            select: {
              employees: true,
              contracts: true,
            },
          },
        },
      });
    });
  }

  static async update(
    id: bigint,
    data: {
      name?: string;
      schedule_type?: 'FIXED' | 'FLEXIBLE';
      weekly_hours?: number;
      is_active?: boolean;
    },
    days?: ScheduleDayDbInput[]
  ) {
    return prisma.$transaction(async (tx) => {
      const updateData: Prisma.working_schedulesUpdateInput = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.schedule_type !== undefined) updateData.schedule_type = data.schedule_type;
      if (data.weekly_hours !== undefined) updateData.weekly_hours = new Prisma.Decimal(data.weekly_hours);
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      await tx.working_schedules.update({
        where: { id },
        data: updateData,
      });

      if (days !== undefined) {
        // Replace schedule days
        await tx.schedule_days.deleteMany({
          where: { schedule_id: id },
        });

        if (days.length > 0) {
          await tx.schedule_days.createMany({
            data: days.map((d) => ({
              schedule_id: id,
              day_of_week: d.day_of_week,
              start_time: d.start_time,
              end_time: d.end_time,
              break_minutes: d.break_minutes,
            })),
          });
        }
      }

      return tx.working_schedules.findUnique({
        where: { id },
        include: {
          schedule_days: {
            orderBy: { day_of_week: 'asc' },
          },
          _count: {
            select: {
              employees: true,
              contracts: true,
            },
          },
        },
      });
    });
  }

  static async delete(id: bigint) {
    return prisma.working_schedules.delete({
      where: { id },
    });
  }
}
