import prisma from "../../config/database";
import {
  AttendanceListInput,
  CheckInInput,
  CheckOutInput,
  CorrectionInput,
} from "./validation";

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "HALF_DAY" | "CORRECTED";

export class AttendanceServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AttendanceServiceError";
  }
}

export function calculateAttendance(params: {
  checkIn: Date;
  checkOut: Date;
  breakMinutes: number;
  standardHours: number;
}) {
  const { checkIn, checkOut, breakMinutes, standardHours } = params;

  if (checkOut <= checkIn) {
    throw new AttendanceServiceError(
      400,
      "INVALID_ATTENDANCE_TIME",
      "Check-out must be after check-in",
    );
  }

  if (breakMinutes < 0 || breakMinutes > 1440) {
    throw new AttendanceServiceError(400, "INVALID_BREAK_TIME", "Invalid break duration");
  }

  const grossHours = (checkOut.getTime() - checkIn.getTime()) / 3_600_000;
  const workedHours = Math.max(0, grossHours - breakMinutes / 60);
  const overtimeHours = Math.max(0, workedHours - standardHours);

  // >= 8h as PRESENT, 4h-<8h as HALF_DAY, <4h as ABSENT/HALF_DAY
  const status: AttendanceStatus = workedHours >= 8 ? "PRESENT" : "HALF_DAY";

  return {
    workedHours: round2(workedHours),
    overtimeHours: round2(overtimeHours),
    status,
  };
}

export class AttendanceService {
  async checkIn(employeeId: bigint, input: CheckInInput) {
    const attendanceDate = input.attendanceDate
      ? parseDateOnly(input.attendanceDate)
      : dateOnly(new Date());

    const checkIn = input.checkIn ? new Date(input.checkIn) : new Date();
    assertValidDate(checkIn, "checkIn");

    await this.ensureEmployee(employeeId);

    const existing = await prisma.attendance.findUnique({
      where: {
        employee_id_attendance_date: {
          employee_id: employeeId,
          attendance_date: attendanceDate,
        },
      },
    });

    if (existing) {
      throw new AttendanceServiceError(
        409,
        "ATTENDANCE_ALREADY_EXISTS",
        "Attendance already exists for this date",
      );
    }

    try {
      return await prisma.attendance.create({
        data: {
          employee_id: employeeId,
          attendance_date: attendanceDate,
          check_in: checkIn,
          worked_hours: 0,
          overtime_hours: 0,
          status: "PRESENT",
        },
      });
    } catch (error: any) {
      if (error?.code === "P2002") {
        throw new AttendanceServiceError(
          409,
          "ATTENDANCE_ALREADY_EXISTS",
          "Attendance already exists for this date",
        );
      }
      throw error;
    }
  }

  async checkOut(employeeId: bigint, input: CheckOutInput) {
    const attendanceDate = input.attendanceDate
      ? parseDateOnly(input.attendanceDate)
      : dateOnly(new Date());

    const checkOut = input.checkOut ? new Date(input.checkOut) : new Date();
    assertValidDate(checkOut, "checkOut");

    const attendance = await prisma.attendance.findUnique({
      where: {
        employee_id_attendance_date: {
          employee_id: employeeId,
          attendance_date: attendanceDate,
        },
      },
    });

    if (!attendance) {
      throw new AttendanceServiceError(
        404,
        "ATTENDANCE_NOT_FOUND",
        "Check-in record not found for this date",
      );
    }

    if (!attendance.check_in) {
      throw new AttendanceServiceError(
        400,
        "CHECK_IN_REQUIRED",
        "Employee must check in before checking out",
      );
    }

    if (attendance.check_out) {
      throw new AttendanceServiceError(
        409,
        "ALREADY_CHECKED_OUT",
        "Employee has already checked out",
      );
    }

    const employee = await prisma.employees.findUnique({
      where: { id: employeeId },
      include: {
        working_schedules: {
          include: {
            schedule_days: true,
          },
        },
      },
    });

    if (!employee) {
      throw new AttendanceServiceError(404, "EMPLOYEE_NOT_FOUND", "Employee not found");
    }

    const dayOfWeek = getScheduleDayOfWeek(attendanceDate);
    const scheduleDay = employee.working_schedules?.schedule_days.find(
      (day: any) => day.day_of_week === dayOfWeek,
    );

    const breakMinutes = scheduleDay?.break_minutes ?? 0;
    const standardHours = scheduleDay
      ? calculateScheduleHours(scheduleDay.start_time, scheduleDay.end_time, breakMinutes)
      : 8;

    const calculation = calculateAttendance({
      checkIn: attendance.check_in,
      checkOut,
      breakMinutes,
      standardHours,
    });

    return prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        check_out: checkOut,
        worked_hours: calculation.workedHours,
        overtime_hours: calculation.overtimeHours,
        status: calculation.status,
      },
    });
  }

  async list(input: AttendanceListInput, currentEmployeeId?: bigint) {
    const page = input.page || 1;
    const limit = input.limit || 20;
    const where: any = {};

    if (currentEmployeeId !== undefined) {
      where.employee_id = currentEmployeeId;
    } else if (input.employeeId !== undefined) {
      where.employee_id = input.employeeId;
    }

    if (input.status) {
      where.status = input.status;
    }

    if (input.startDate || input.endDate) {
      where.attendance_date = {};
      if (input.startDate) {
        where.attendance_date.gte = parseDateOnly(input.startDate);
      }
      if (input.endDate) {
        where.attendance_date.lte = parseDateOnly(input.endDate);
      }
    }

    const [items, total] = await prisma.$transaction([
      prisma.attendance.findMany({
        where,
        orderBy: { attendance_date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employees: {
            select: {
              id: true,
              employee_code: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: bigint, currentEmployeeId?: bigint) {
    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!attendance) {
      throw new AttendanceServiceError(404, "ATTENDANCE_NOT_FOUND", "Attendance not found");
    }

    if (currentEmployeeId !== undefined && attendance.employee_id !== currentEmployeeId) {
      throw new AttendanceServiceError(
        403,
        "FORBIDDEN",
        "You cannot access another employee's attendance",
      );
    }

    return attendance;
  }

  async correct(id: bigint, input: CorrectionInput, correctedBy: bigint) {
    const attendance = await prisma.attendance.findUnique({ where: { id } });

    if (!attendance) {
      throw new AttendanceServiceError(404, "ATTENDANCE_NOT_FOUND", "Attendance not found");
    }

    if (!input.correctionNote?.trim()) {
      throw new AttendanceServiceError(
        400,
        "CORRECTION_NOTE_REQUIRED",
        "Correction note is required",
      );
    }

    const checkIn = input.checkIn ? new Date(input.checkIn) : attendance.check_in;
    const checkOut = input.checkOut ? new Date(input.checkOut) : attendance.check_out;

    if (checkIn && checkOut && checkOut <= checkIn) {
      throw new AttendanceServiceError(
        400,
        "INVALID_ATTENDANCE_TIME",
        "Check-out must be after check-in",
      );
    }

    return prisma.attendance.update({
      where: { id },
      data: {
        check_in: checkIn,
        check_out: checkOut,
        ...(input.workedHours !== undefined ? { worked_hours: input.workedHours } : {}),
        status: input.status || "CORRECTED",
        correction_note: input.correctionNote.trim(),
        corrected_by: correctedBy,
      },
    });
  }

  private async ensureEmployee(employeeId: bigint) {
    const employee = await prisma.employees.findUnique({
      where: { id: employeeId },
      select: { id: true, employment_status: true },
    });

    if (!employee) {
      throw new AttendanceServiceError(404, "EMPLOYEE_NOT_FOUND", "Employee not found");
    }

    if (employee.employment_status !== "ACTIVE") {
      throw new AttendanceServiceError(
        400,
        "EMPLOYEE_INACTIVE",
        "Inactive employees cannot record attendance",
      );
    }
  }
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day));

  if (
    result.getUTCFullYear() !== year ||
    result.getUTCMonth() !== month - 1 ||
    result.getUTCDate() !== day
  ) {
    throw new AttendanceServiceError(400, "INVALID_DATE", "Invalid attendance date");
  }

  return result;
}

function dateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function assertValidDate(value: Date, field: string) {
  if (Number.isNaN(value.getTime())) {
    throw new AttendanceServiceError(400, "INVALID_DATETIME", `Invalid ${field} timestamp`);
  }
}

function getScheduleDayOfWeek(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day; // 1 (Mon) to 7 (Sun)
}

function calculateScheduleHours(startTime: Date | null, endTime: Date | null, breakMinutes: number) {
  if (!startTime || !endTime) return 8;

  const startMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
  const endMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();

  return Math.max(0, (endMinutes - startMinutes - breakMinutes) / 60);
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
