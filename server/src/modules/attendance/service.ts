import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

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

  // The testing checklist defines >= 8h as PRESENT and 4-<8h as HALF_DAY.
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
        employeeId_attendanceDate: {
          employeeId,
          attendanceDate,
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
          employeeId,
          attendanceDate,
          checkIn,
          workedHours: 0,
          overtimeHours: 0,
          status: "PRESENT",
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
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
        employeeId_attendanceDate: {
          employeeId,
          attendanceDate,
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

    if (!attendance.checkIn) {
      throw new AttendanceServiceError(
        400,
        "CHECK_IN_REQUIRED",
        "Employee must check in before checking out",
      );
    }

    if (attendance.checkOut) {
      throw new AttendanceServiceError(
        409,
        "ALREADY_CHECKED_OUT",
        "Employee has already checked out",
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        schedule: {
          include: {
            scheduleDays: true,
          },
        },
      },
    });

    if (!employee) {
      throw new AttendanceServiceError(404, "EMPLOYEE_NOT_FOUND", "Employee not found");
    }

    if (!employee.schedule) {
      throw new AttendanceServiceError(
        400,
        "WORKING_SCHEDULE_REQUIRED",
        "Employee does not have a working schedule",
      );
    }

    const dayOfWeek = getScheduleDayOfWeek(attendanceDate);
    const scheduleDay = employee.schedule.scheduleDays.find(
      (day) => day.dayOfWeek === dayOfWeek,
    );

    const breakMinutes = scheduleDay?.breakMinutes ?? 0;
    const standardHours = scheduleDay
      ? calculateScheduleHours(scheduleDay.startTime, scheduleDay.endTime, breakMinutes)
      : 0;

    const calculation = calculateAttendance({
      checkIn: attendance.checkIn,
      checkOut,
      breakMinutes,
      standardHours,
    });

    return prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut,
        workedHours: calculation.workedHours,
        overtimeHours: calculation.overtimeHours,
        status: calculation.status,
      },
    });
  }

  async list(input: AttendanceListInput, currentEmployeeId?: bigint) {
    const page = input.page;
    const limit = input.limit;
    const where: Prisma.AttendanceWhereInput = {};

    // EMPLOYEE requests are always scoped to their own employee ID.
    if (currentEmployeeId !== undefined) {
      where.employeeId = currentEmployeeId;
    } else if (input.employeeId !== undefined) {
      where.employeeId = input.employeeId;
    }

    if (input.status) {
      where.status = input.status;
    }

    if (input.startDate || input.endDate) {
      where.attendanceDate = {};
      if (input.startDate) {
        where.attendanceDate.gte = parseDateOnly(input.startDate);
      }
      if (input.endDate) {
        where.attendanceDate.lte = parseDateOnly(input.endDate);
      }
    }

    const [items, total] = await prisma.$transaction([
      prisma.attendance.findMany({
        where,
        orderBy: { attendanceDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
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
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!attendance) {
      throw new AttendanceServiceError(404, "ATTENDANCE_NOT_FOUND", "Attendance not found");
    }

    if (currentEmployeeId !== undefined && attendance.employeeId !== currentEmployeeId) {
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

    const checkIn = input.checkIn ? new Date(input.checkIn) : attendance.checkIn;
    const checkOut = input.checkOut ? new Date(input.checkOut) : attendance.checkOut;

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
        checkIn,
        checkOut,
        ...(input.workedHours !== undefined ? { workedHours: input.workedHours } : {}),
        ...(input.overtimeHours !== undefined ? { overtimeHours: input.overtimeHours } : {}),
        status: "CORRECTED",
        correctionNote: input.correctionNote.trim(),
        correctedBy,
      },
    });
  }

  async manualInsert(
    input: {
      employeeId: bigint;
      attendanceDate: string;
      checkIn?: string;
      checkOut?: string;
      workedHours?: number;
      overtimeHours?: number;
      status?: AttendanceStatus;
      correctionNote?: string;
    },
    createdBy: bigint,
  ) {
    await this.ensureEmployee(input.employeeId);

    const attendanceDate = parseDateOnly(input.attendanceDate);
    const checkIn = input.checkIn ? new Date(input.checkIn) : null;
    const checkOut = input.checkOut ? new Date(input.checkOut) : null;

    if (checkIn) assertValidDate(checkIn, "checkIn");
    if (checkOut) assertValidDate(checkOut, "checkOut");

    if (checkIn && checkOut && checkOut <= checkIn) {
      throw new AttendanceServiceError(
        400,
        "INVALID_ATTENDANCE_TIME",
        "Check-out must be after check-in",
      );
    }

    const status = input.status ?? "PRESENT";

    if (status === "CORRECTED" && !input.correctionNote?.trim()) {
      throw new AttendanceServiceError(
        400,
        "CORRECTION_NOTE_REQUIRED",
        "Correction note is required for corrected attendance",
      );
    }

    try {
      return await prisma.attendance.create({
        data: {
          employeeId: input.employeeId,
          attendanceDate,
          checkIn,
          checkOut,
          workedHours: input.workedHours ?? 0,
          overtimeHours: input.overtimeHours ?? 0,
          status,
          correctionNote: input.correctionNote?.trim() ?? null,
          correctedBy: status === "CORRECTED" ? createdBy : null,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new AttendanceServiceError(
          409,
          "ATTENDANCE_ALREADY_EXISTS",
          "Attendance already exists for this date",
        );
      }
      throw error;
    }
  }

  private async ensureEmployee(employeeId: bigint) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, employmentStatus: true },
    });

    if (!employee) {
      throw new AttendanceServiceError(404, "EMPLOYEE_NOT_FOUND", "Employee not found");
    }

    if (employee.employmentStatus !== "ACTIVE") {
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
  return date.getUTCDay();
}

function calculateScheduleHours(startTime: Date | null, endTime: Date | null, breakMinutes: number) {
  if (!startTime || !endTime) return 0;

  const startMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
  const endMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();

  return Math.max(0, (endMinutes - startMinutes - breakMinutes) / 60);
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
