import { Request, Response } from "express";
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
    employeeId?: bigint | string | null;
    role: string;
  };
};

export const attendanceController = {
  async checkIn(req: AuthenticatedRequest, res: Response) {
    try {
      const input = checkInSchema.parse(req.body ?? {});
      const employeeId = getEmployeeId(req);

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
      const employeeId = getEmployeeId(req);

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
      const employeeId = isEmployee(req) ? getEmployeeId(req) : undefined;

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
      const employeeId = isEmployee(req) ? getEmployeeId(req) : undefined;

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

function getEmployeeId(req: AuthenticatedRequest): bigint {
  if (!req.user?.employeeId) {
    throw new AttendanceServiceError(
      403,
      "EMPLOYEE_PROFILE_REQUIRED",
      "Authenticated user is not linked to an employee",
    );
  }

  return BigInt(req.user.employeeId);
}

function getUserId(req: AuthenticatedRequest): bigint {
  if (!req.user?.id) {
    throw new AttendanceServiceError(401, "UNAUTHORIZED", "Authentication required");
  }

  return BigInt(req.user.id);
}

function isEmployee(req: AuthenticatedRequest): boolean {
  return req.user?.role === "EMPLOYEE";
}

function serializeAttendance(value: any) {
  if (!value) return value;

  return {
    ...value,
    id: value.id?.toString(),
    employeeId: value.employeeId?.toString(),
    correctedBy: value.correctedBy?.toString() ?? null,
    workedHours: value.workedHours === null ? null : Number(value.workedHours),
    overtimeHours: value.overtimeHours === null ? null : Number(value.overtimeHours),
    employee: value.employee
      ? {
          ...value.employee,
          id: value.employee.id?.toString(),
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
      message: "An unexpected error occurred",
      details: [],
    },
  });
}
