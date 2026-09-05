import { Request, Response } from "express";

import {
  allocationCreateSchema,
  allocationIdSchema,
  allocationListSchema,
  allocationUpdateSchema,
  leaveRequestCreateSchema,
  leaveRequestIdSchema,
  leaveRequestListSchema,
  leaveTypeCreateSchema,
  leaveTypeIdSchema,
  leaveTypeListSchema,
  leaveTypeUpdateSchema,
} from "./validation";

import {
  TimeOffService,
  TimeOffServiceError,
  serializeTimeOff,
} from "./service";

const service = new TimeOffService();

type AuthenticatedRequest = Request & {
  user?: {
    id?: string | bigint;
    employeeId?: string | bigint | null;
    role?: string;
  };
};

function userId(req: AuthenticatedRequest): bigint {
  const id = req.user?.id;

  if (id === undefined || id === null) {
    throw new TimeOffServiceError(
      "UNAUTHORIZED",
      "Authenticated user is required",
      401,
    );
  }

  return BigInt(id);
}

function employeeId(req: AuthenticatedRequest): bigint {
  const id = req.user?.employeeId;

  if (id === undefined || id === null) {
    throw new TimeOffServiceError(
      "EMPLOYEE_NOT_LINKED",
      "Authenticated user is not linked to an employee",
      403,
    );
  }

  return BigInt(id);
}

function sendError(res: Response, error: unknown) {
  if (error instanceof TimeOffServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: [],
      },
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
      details: [],
    },
  });
}

function sendValidationError(res: Response, error: unknown) {
  if (error && typeof error === "object" && "issues" in error) {
    const issues = (
      error as {
        issues: Array<{
          path: PropertyKey[];
          message: string;
        }>;
      }
    ).issues;

    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: issues.map((issue) => ({
          field: issue.path.join("."),
          issue: issue.message,
        })),
      },
    });
  }

  return sendError(res, error);
}

// ============================================================
// LEAVE TYPES
// ============================================================

export async function listLeaveTypes(
  req: Request,
  res: Response,
) {
  try {
    const input = leaveTypeListSchema.parse(req.query);

    const data = await service.listLeaveTypes(input);

    return res.status(200).json({
      success: true,
      data: serializeTimeOff(data),
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
}

export async function createLeaveType(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const input = leaveTypeCreateSchema.parse(req.body);

    const data = await service.createLeaveType(input);

    return res.status(201).json({
      success: true,
      data: serializeTimeOff(data),
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
}

export async function updateLeaveType(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id } = leaveTypeIdSchema.parse(req.params);
    const input = leaveTypeUpdateSchema.parse(req.body);

    const data = await service.updateLeaveType(id, input);

    return res.status(200).json({
      success: true,
      data: serializeTimeOff(data),
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
}

export async function deleteLeaveType(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id } = leaveTypeIdSchema.parse(req.params);

    const data = await service.deleteLeaveType(id);

    return res.status(200).json({
      success: true,
      data: serializeTimeOff(data),
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
}

// ============================================================
// ALLOCATIONS
// ============================================================

export async function listAllocations(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const input = allocationListSchema.parse(req.query);

    const isEmployee = req.user?.role === "EMPLOYEE";
    const currentEmployeeId = isEmployee
      ? employeeId(req)
      : undefined;

    const result = await service.listAllocations(
      input,
      currentEmployeeId,
    );

    return res.status(200).json({
      success: true,
      data: serializeTimeOff(result.data),
      meta: result.meta,
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
}

export async function getAllocation(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id } = allocationIdSchema.parse(req.params);

    const isEmployee = req.user?.role === "EMPLOYEE";
    const currentEmployeeId = isEmployee
      ? employeeId(req)
      : undefined;

    const data = await service.getAllocation(
      id,
      currentEmployeeId,
    );

    return res.status(200).json({
      success: true,
      data: serializeTimeOff(data),
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
}

export async function createAllocation(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const input = allocationCreateSchema.parse(req.body);

    const data = await service.createAllocation(
      input,
      userId(req),
    );

    return res.status(201).json({
      success: true,
      data: serializeTimeOff(data),
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
}

export async function updateAllocation(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id } = allocationIdSchema.parse(req.params);
    const input = allocationUpdateSchema.parse(req.body);

    const data = await service.updateAllocation(
      id,
      input,
      userId(req),
    );

    return res.status(200).json({
      success: true,
      data: serializeTimeOff(data),
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
}

// ============================================================
// LEAVE REQUESTS
// ============================================================

export async function listLeaveRequests(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const input = leaveRequestListSchema.parse(req.query);

    const isEmployee = req.user?.role === "EMPLOYEE";
    const currentEmployeeId = isEmployee
      ? employeeId(req)
      : undefined;

    const result = await service.listLeaveRequests(
      input,
      currentEmployeeId,
    );

    return res.status(200).json({
      success: true,
      data: serializeTimeOff(result.data),
      meta: result.meta,
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
}

export async function getLeaveRequest(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id } = leaveRequestIdSchema.parse(req.params);

    const isEmployee = req.user?.role === "EMPLOYEE";
    const currentEmployeeId = isEmployee
      ? employeeId(req)
      : undefined;

    const data = await service.getLeaveRequest(
      id,
      currentEmployeeId,
    );

    return res.status(200).json({
      success: true,
      data: serializeTimeOff(data),
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
}

export async function createLeaveRequest(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const input = leaveRequestCreateSchema.parse(req.body);

    const data = await service.createLeaveRequest(
      input,
      employeeId(req),
      userId(req),
    );

    return res.status(201).json({
      success: true,
      data: serializeTimeOff(data),
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
}

export async function approveLeaveRequest(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id } = leaveRequestIdSchema.parse(req.params);

    const data = await service.approveLeaveRequest(
      id,
      userId(req),
    );

    return res.status(200).json({
      success: true,
      data: serializeTimeOff(data),
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
}

export async function rejectLeaveRequest(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id } = leaveRequestIdSchema.parse(req.params);

    const data = await service.rejectLeaveRequest(id);

    return res.status(200).json({
      success: true,
      data: serializeTimeOff(data),
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
}

export async function cancelLeaveRequest(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id } = leaveRequestIdSchema.parse(req.params);

    const data = await service.cancelLeaveRequest(
      id,
      employeeId(req),
    );

    return res.status(200).json({
      success: true,
      data: serializeTimeOff(data),
    });
  } catch (error) {
    return sendValidationError(res, error);
  }
}
