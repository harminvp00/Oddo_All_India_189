import { Request, Response } from "express";
import prisma from "../../config/database";
import {
  attendanceIdSchema,
  attendanceListSchema,
  checkInSchema,
  checkOutSchema,
  correctionSchema,
} from "./validation";
import { AttendanceService, AttendanceServiceError } from "./service";

const attendanceService = new AttendanceService();

type AuthenticatedRequest = Request & {
  user?: {
    id: bigint | string;
    userId?: bigint | string;
    employeeId?: bigint | string | null;
    role: string;
  };
};

export const attendanceController = {
  async checkIn(req: AuthenticatedRequest, res: Response) {
    try {
      const input = checkInSchema.parse(req.body ?? {});
      const employeeId = await getEmployeeId(req);

      const attendance = await attendanceService.checkIn(employeeId, input);

      return res.status(201).json({
        success: true,
        data: serializeAttendance(attendance),
      });
    } catch (error) {
      return handleError(res, error);
    }
  },

  async checkOut(req: AuthenticatedRequest, res: Response) {
    try {
      const input = checkOutSchema.parse(req.body ?? {});
      const employeeId = await getEmployeeId(req);

      const attendance = await attendanceService.checkOut(employeeId, input);

      return res.status(200).json({
        success: true,
        data: serializeAttendance(attendance),
      });
    } catch (error) {
      return handleError(res, error);
    }
  },

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const input = attendanceListSchema.parse(req.query);
      const employeeId = isEmployee(req) ? await getEmployeeId(req) : undefined;

      const result = await attendanceService.list(input, employeeId);

      return res.status(200).json({
        success: true,
        data: result.items.map(serializeAttendance),
        meta: result.meta,
      });
    } catch (error) {
      return handleError(res, error);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = attendanceIdSchema.parse(req.params);
      const employeeId = isEmployee(req) ? await getEmployeeId(req) : undefined;

      const attendance = await attendanceService.getById(id, employeeId);

      return res.status(200).json({
        success: true,
        data: serializeAttendance(attendance),
      });
    } catch (error) {
      return handleError(res, error);
    }
  },

  async correct(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = attendanceIdSchema.parse(req.params);
      const input = correctionSchema.parse(req.body ?? {});
      const correctedBy = getUserId(req);

      const attendance = await attendanceService.correct(id, input, correctedBy);

      return res.status(200).json({
        success: true,
        data: serializeAttendance(attendance),
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
};

async function getEmployeeId(req: AuthenticatedRequest): Promise<bigint> {
  if (req.user?.employeeId) {
    return BigInt(req.user.employeeId);
  }

  const uid = req.user?.id || req.user?.userId;
  if (!uid) {
    throw new AttendanceServiceError(401, "UNAUTHORIZED", "Authentication required");
  }

  const bigintUserId = BigInt(uid);

  // Check if employee profile already exists in DB
  let employee = await prisma.employees.findFirst({
    where: { user_id: bigintUserId },
  });

  if (!employee) {
    const user = await prisma.users.findUnique({ where: { id: bigintUserId } });
    if (!user) {
      throw new AttendanceServiceError(404, "USER_NOT_FOUND", "User not found");
    }

    const defaultSchedule = await prisma.working_schedules.findFirst({ where: { is_active: true } });
    const defaultDept = await prisma.departments.findFirst({ where: { is_active: true } });
    const defaultPos = await prisma.job_positions.findFirst({ where: { is_active: true } });

    const nameParts = (user.full_name || user.email.split('@')[0]).trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || `${user.role}`;
    const randomCode = `EMP${String(user.id).padStart(4, '0')}`;

    employee = await prisma.employees.create({
      data: {
        employee_code: randomCode,
        first_name: firstName,
        last_name: lastName,
        hire_date: new Date(),
        employment_status: "ACTIVE",
        employee_type: "FULL_TIME",
        user_id: bigintUserId,
        department_id: defaultDept?.id,
        position_id: defaultPos?.id,
        schedule_id: defaultSchedule?.id,
      },
    });
  }

  if (req.user) {
    req.user.employeeId = employee.id.toString();
  }

  return employee.id;
}

function getUserId(req: AuthenticatedRequest): bigint {
  const uid = req.user?.id || req.user?.userId;
  if (!uid) {
    throw new AttendanceServiceError(401, "UNAUTHORIZED", "Authentication required");
  }

  return BigInt(uid);
}

function isEmployee(req: AuthenticatedRequest): boolean {
  return req.user?.role === "EMPLOYEE";
}

function serializeAttendance(value: any) {
  if (!value) return value;

  const emp = value.employees || value.employee;
  return {
    id: (value.id)?.toString(),
    employeeId: (value.employee_id || value.employeeId)?.toString(),
    attendanceDate: value.attendance_date instanceof Date ? value.attendance_date.toISOString().split('T')[0] : value.attendanceDate,
    checkIn: value.check_in instanceof Date ? value.check_in.toISOString() : value.checkIn,
    checkOut: value.check_out instanceof Date ? value.check_out.toISOString() : value.checkOut,
    workedHours: value.worked_hours !== undefined && value.worked_hours !== null ? Number(value.worked_hours) : (value.workedHours !== undefined ? Number(value.workedHours) : 0),
    overtimeHours: value.overtime_hours !== undefined && value.overtime_hours !== null ? Number(value.overtime_hours) : (value.overtimeHours !== undefined ? Number(value.overtimeHours) : 0),
    status: value.status,
    correctionNote: value.correction_note || value.correctionNote || null,
    correctedBy: (value.corrected_by || value.correctedBy)?.toString() || null,
    employee: emp
      ? {
          id: emp.id?.toString(),
          employeeCode: emp.employee_code || emp.employeeCode,
          firstName: emp.first_name || emp.firstName,
          lastName: emp.last_name || emp.lastName,
          name: `${emp.first_name || emp.firstName || ''} ${emp.last_name || emp.lastName || ''}`.trim(),
        }
      : undefined,
  };
}

function handleError(res: Response, error: unknown) {
  if (error instanceof AttendanceServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: [],
      },
    });
  }

  if (error instanceof Error && error.name === "ZodError") {
    const zodError = error as Error & { issues?: Array<{ path: (string | number)[]; message: string }> };

    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: (zodError.issues ?? []).map((issue) => ({
          field: issue.path.join("."),
          issue: issue.message,
        })),
      },
    });
  }

  console.error("Attendance module error:", error);

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: (error as Error)?.message || "An unexpected error occurred",
      details: [],
    },
  });
}
