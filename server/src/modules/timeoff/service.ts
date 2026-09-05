import prisma from "../../lib/prisma";

import {
  AllocationCreateInput,
  AllocationListInput,
  AllocationUpdateInput,
  LeaveRequestCreateInput,
  LeaveRequestListInput,
  LeaveTypeCreateInput,
  LeaveTypeUpdateInput,
} from "./validation";

export class TimeOffServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 400,
  ) {
    super(message);
    this.name = "TimeOffServiceError";
  }
}

function toDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function decimalNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);

  if (value && typeof value === "object") {
    if ("toNumber" in value && typeof (value as { toNumber?: unknown }).toNumber === "function") {
      return (value as { toNumber: () => number }).toNumber();
    }
    if ("d" in value && Array.isArray((value as any).d)) {
      const v = value as { s?: number; e?: number; d: number[] };
      return (v.s ?? 1) * Number(v.d.join(""));
    }
  }

  return Number(value ?? 0);
}

export function calculateAvailableUnits(
  allocatedUnits: number,
  usedUnits: number,
): number {
  return Math.max(0, Number((allocatedUnits - usedUnits).toFixed(2)));
}

export function calculateInclusiveDays(
  startDate: string,
  endDate: string,
): number {
  const start = toDate(startDate).getTime();
  const end = toDate(endDate).getTime();

  if (end < start) {
    throw new TimeOffServiceError(
      "INVALID_DATE_RANGE",
      "endDate must be greater than or equal to startDate",
    );
  }

  return Math.floor((end - start) / 86_400_000) + 1;
}

function serialize(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();

  if (value instanceof Date) return value.toISOString();

  if (value && typeof value === "object") {
    if ("toNumber" in value && typeof (value as { toNumber?: unknown }).toNumber === "function") {
      return (value as { toNumber: () => number }).toNumber();
    }
    if ("d" in value && Array.isArray((value as any).d)) {
      const v = value as { s?: number; e?: number; d: number[] };
      return (v.s ?? 1) * Number(v.d.join(""));
    }
  }

  if (Array.isArray(value)) {
    return value.map(serialize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serialize(item)]),
    );
  }

  return value;
}

export function serializeTimeOff(value: unknown): unknown {
  return serialize(value);
}

export class TimeOffService {
  // ============================================================
  // LEAVE TYPES
  // ============================================================

  async listLeaveTypes(input: {
    search?: string;
    isActive?: boolean;
  }) {
    return prisma.leaveType.findMany({
      where: {
        ...(input.search
          ? {
              OR: [
                {
                  name: {
                    contains: input.search,
                    mode: "insensitive",
                  },
                },
                {
                  code: {
                    contains: input.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(input.isActive === undefined
          ? {}
          : { isActive: input.isActive }),
      },
      orderBy: { name: "asc" },
    });
  }

  async createLeaveType(input: LeaveTypeCreateInput) {
    try {
      return await prisma.leaveType.create({
        data: {
          name: input.name,
          code: input.code.toUpperCase(),
          unit: input.unit,
          requiresAllocation: input.requiresAllocation,
          requiresApproval: input.requiresApproval,
          payrollDeductible: input.payrollDeductible,
          maxConsecutiveUnits: input.maxConsecutiveUnits,
          isActive: input.isActive,
        },
      });
    } catch (error: any) {
      if (error?.code === "P2002") {
        throw new TimeOffServiceError(
          "DUPLICATE_LEAVE_TYPE",
          "Leave type name or code already exists",
          409,
        );
      }

      throw error;
    }
  }

  async updateLeaveType(
    id: bigint,
    input: LeaveTypeUpdateInput,
  ) {
    try {
      return await prisma.leaveType.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.code !== undefined
            ? { code: input.code.toUpperCase() }
            : {}),
          ...(input.unit !== undefined ? { unit: input.unit } : {}),
          ...(input.requiresAllocation !== undefined
            ? { requiresAllocation: input.requiresAllocation }
            : {}),
          ...(input.requiresApproval !== undefined
            ? { requiresApproval: input.requiresApproval }
            : {}),
          ...(input.payrollDeductible !== undefined
            ? { payrollDeductible: input.payrollDeductible }
            : {}),
          ...(input.maxConsecutiveUnits !== undefined
            ? { maxConsecutiveUnits: input.maxConsecutiveUnits }
            : {}),
          ...(input.isActive !== undefined
            ? { isActive: input.isActive }
            : {}),
        },
      });
    } catch (error: any) {
      if (error?.code === "P2002") {
        throw new TimeOffServiceError(
          "DUPLICATE_LEAVE_TYPE",
          "Leave type name or code already exists",
          409,
        );
      }

      if (error?.code === "P2025") {
        throw new TimeOffServiceError(
          "LEAVE_TYPE_NOT_FOUND",
          "Leave type not found",
          404,
        );
      }

      throw error;
    }
  }

  async deleteLeaveType(id: bigint) {
    try {
      return await prisma.leaveType.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error?.code === "P2025") {
        throw new TimeOffServiceError(
          "LEAVE_TYPE_NOT_FOUND",
          "Leave type not found",
          404,
        );
      }

      if (error?.code === "P2003") {
        throw new TimeOffServiceError(
          "LEAVE_TYPE_IN_USE",
          "Leave type cannot be deleted because allocations or requests reference it",
          409,
        );
      }

      throw error;
    }
  }

  // ============================================================
  // ALLOCATIONS
  // ============================================================

  async listAllocations(
    input: AllocationListInput,
    currentEmployeeId?: bigint,
  ) {
    const employeeId = currentEmployeeId ?? input.employeeId;

    const where = {
      ...(employeeId !== undefined ? { employeeId } : {}),
      ...(input.leaveTypeId !== undefined
        ? { leaveTypeId: input.leaveTypeId }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    };

    const skip = (input.page - 1) * input.limit;

    const [data, total] = await prisma.$transaction([
      prisma.leaveAllocation.findMany({
        where,
        orderBy: [{ validFrom: "desc" }, { id: "desc" }],
        skip,
        take: input.limit,
      }),
      prisma.leaveAllocation.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    };
  }

  async getAllocation(id: bigint, currentEmployeeId?: bigint) {
    const allocation = await prisma.leaveAllocation.findUnique({
      where: { id },
    });

    if (!allocation) {
      throw new TimeOffServiceError(
        "ALLOCATION_NOT_FOUND",
        "Leave allocation not found",
        404,
      );
    }

    if (
      currentEmployeeId !== undefined &&
      allocation.employeeId !== currentEmployeeId
    ) {
      throw new TimeOffServiceError(
        "FORBIDDEN",
        "You cannot access another employee's leave allocation",
        403,
      );
    }

    return allocation;
  }

  async createAllocation(
    input: AllocationCreateInput,
    actingUserId: bigint,
  ) {
    const employee = await prisma.employee.findUnique({
      where: { id: input.employeeId },
    });

    if (!employee) {
      throw new TimeOffServiceError(
        "EMPLOYEE_NOT_FOUND",
        "Employee not found",
        404,
      );
    }

    const leaveType = await prisma.leaveType.findUnique({
      where: { id: input.leaveTypeId },
    });

    if (!leaveType) {
      throw new TimeOffServiceError(
        "LEAVE_TYPE_NOT_FOUND",
        "Leave type not found",
        404,
      );
    }

    if (!leaveType.isActive) {
      throw new TimeOffServiceError(
        "LEAVE_TYPE_INACTIVE",
        "Cannot allocate an inactive leave type",
      );
    }

    if (input.allocatedUnits < 0) {
      throw new TimeOffServiceError(
        "INVALID_ALLOCATION",
        "allocatedUnits cannot be negative",
      );
    }

    return prisma.leaveAllocation.create({
      data: {
        employeeId: input.employeeId,
        leaveTypeId: input.leaveTypeId,
        validFrom: toDate(input.validFrom),
        validTo: toDate(input.validTo),
        allocatedUnits: input.allocatedUnits,
        usedUnits: 0,
        status: input.status,
        ...(input.status === "APPROVED"
          ? {
              approvedBy: actingUserId,
              approvedAt: new Date(),
            }
          : {}),
      },
    });
  }

  async updateAllocation(
    id: bigint,
    input: AllocationUpdateInput,
    actingUserId: bigint,
  ) {
    const allocation = await prisma.leaveAllocation.findUnique({
      where: { id },
    });

    if (!allocation) {
      throw new TimeOffServiceError(
        "ALLOCATION_NOT_FOUND",
        "Leave allocation not found",
        404,
      );
    }

    const currentAllocated = decimalNumber(allocation.allocatedUnits);
    const currentUsed = decimalNumber(allocation.usedUnits);

    const allocatedUnits =
      input.allocatedUnits ?? currentAllocated;

    if (allocatedUnits < currentUsed) {
      throw new TimeOffServiceError(
        "ALLOCATION_BELOW_USED",
        `allocatedUnits cannot be less than usedUnits (${currentUsed})`,
      );
    }

    const validFrom = input.validFrom
      ? toDate(input.validFrom)
      : allocation.validFrom;

    const validTo = input.validTo
      ? toDate(input.validTo)
      : allocation.validTo;

    if (validTo < validFrom) {
      throw new TimeOffServiceError(
        "INVALID_DATE_RANGE",
        "validTo must be greater than or equal to validFrom",
      );
    }

    const nextStatus = input.status ?? allocation.status;

    const approving =
      nextStatus === "APPROVED" &&
      allocation.status !== "APPROVED";

    return prisma.leaveAllocation.update({
      where: { id },
      data: {
        validFrom,
        validTo,
        allocatedUnits,
        status: nextStatus,
        ...(approving
          ? {
              approvedBy: actingUserId,
              approvedAt: new Date(),
            }
          : {}),
      },
    });
  }

  // ============================================================
  // LEAVE REQUESTS
  // ============================================================

  async listLeaveRequests(
    input: LeaveRequestListInput,
    currentEmployeeId?: bigint,
  ) {
    const employeeId = currentEmployeeId ?? input.employeeId;

    const where = {
      ...(employeeId !== undefined ? { employeeId } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.startDate || input.endDate
        ? {
            startDate: {
              ...(input.startDate
                ? { gte: toDate(input.startDate) }
                : {}),
              ...(input.endDate
                ? { lte: toDate(input.endDate) }
                : {}),
            },
          }
        : {}),
    };

    const skip = (input.page - 1) * input.limit;

    const [data, total] = await prisma.$transaction([
      prisma.leaveRequest.findMany({
        where,
        orderBy: [{ startDate: "desc" }, { id: "desc" }],
        skip,
        take: input.limit,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    };
  }

  async getLeaveRequest(
    id: bigint,
    currentEmployeeId?: bigint,
  ) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new TimeOffServiceError(
        "LEAVE_REQUEST_NOT_FOUND",
        "Leave request not found",
        404,
      );
    }

    if (
      currentEmployeeId !== undefined &&
      request.employeeId !== currentEmployeeId
    ) {
      throw new TimeOffServiceError(
        "FORBIDDEN",
        "You cannot access another employee's leave request",
        403,
      );
    }

    return request;
  }

  async createLeaveRequest(
    input: LeaveRequestCreateInput,
    employeeId: bigint,
    actingUserId: bigint,
  ) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new TimeOffServiceError(
        "EMPLOYEE_NOT_FOUND",
        "Employee not found",
        404,
      );
    }

    const leaveType = await prisma.leaveType.findUnique({
      where: { id: input.leaveTypeId },
    });

    if (!leaveType) {
      throw new TimeOffServiceError(
        "LEAVE_TYPE_NOT_FOUND",
        "Leave type not found",
        404,
      );
    }

    if (!leaveType.isActive) {
      throw new TimeOffServiceError(
        "LEAVE_TYPE_INACTIVE",
        "Cannot request an inactive leave type",
      );
    }

    if (
      leaveType.maxConsecutiveUnits !== null &&
      leaveType.maxConsecutiveUnits !== undefined &&
      input.requestedUnits >
        decimalNumber(leaveType.maxConsecutiveUnits)
    ) {
      throw new TimeOffServiceError(
        "MAX_CONSECUTIVE_LIMIT",
        `Requested units exceed the maximum consecutive limit of ${decimalNumber(
          leaveType.maxConsecutiveUnits,
        )}`,
      );
    }

    const allocation = leaveType.requiresAllocation
      ? await this.findSufficientAllocation(
          employeeId,
          input.leaveTypeId,
          input.startDate,
          input.endDate,
          input.requestedUnits,
        )
      : null;

    if (leaveType.requiresAllocation && !allocation) {
      throw new TimeOffServiceError(
        "INSUFFICIENT_LEAVE_BALANCE",
        "Insufficient leave balance",
      );
    }

    if (!leaveType.requiresApproval) {
      return this.approveNewRequestImmediately(
        input,
        employeeId,
        actingUserId,
        allocation?.id,
      );
    }

    return prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId: input.leaveTypeId,
        allocationId: allocation?.id ?? null,
        startDate: toDate(input.startDate),
        endDate: toDate(input.endDate),
        requestedUnits: input.requestedUnits,
        reason: input.reason,
        status: "PENDING",
      },
    });
  }

  private async findSufficientAllocation(
    employeeId: bigint,
    leaveTypeId: bigint,
    startDate: string,
    endDate: string,
    requestedUnits: number,
  ) {
    const allocations = await prisma.leaveAllocation.findMany({
      where: {
        employeeId,
        leaveTypeId,
        status: "APPROVED",
        validFrom: { lte: toDate(startDate) },
        validTo: { gte: toDate(endDate) },
      },
      orderBy: { validFrom: "asc" },
    });

    return (
      allocations.find((allocation: any) => {
        const available = calculateAvailableUnits(
          decimalNumber(allocation.allocatedUnits),
          decimalNumber(allocation.usedUnits),
        );

        return available >= requestedUnits;
      }) ?? null
    );
  }

  private async approveNewRequestImmediately(
    input: LeaveRequestCreateInput,
    employeeId: bigint,
    actingUserId: bigint,
    allocationId?: bigint,
  ) {
    return prisma.$transaction(async (tx: any) => {
      if (allocationId !== undefined) {
        const allocation = await tx.leaveAllocation.findUnique({
          where: { id: allocationId },
        });

        if (!allocation) {
          throw new TimeOffServiceError(
            "ALLOCATION_NOT_FOUND",
            "Leave allocation not found",
            404,
          );
        }

        const available = calculateAvailableUnits(
          decimalNumber(allocation.allocatedUnits),
          decimalNumber(allocation.usedUnits),
        );

        if (available < input.requestedUnits) {
          throw new TimeOffServiceError(
            "INSUFFICIENT_LEAVE_BALANCE",
            "Insufficient leave balance",
          );
        }

        await tx.leaveAllocation.update({
          where: { id: allocationId },
          data: {
            usedUnits: {
              increment: input.requestedUnits,
            },
          },
        });
      }

      return tx.leaveRequest.create({
        data: {
          employeeId,
          leaveTypeId: input.leaveTypeId,
          allocationId: allocationId ?? null,
          startDate: toDate(input.startDate),
          endDate: toDate(input.endDate),
          requestedUnits: input.requestedUnits,
          reason: input.reason,
          status: "APPROVED",
          approvedBy: actingUserId,
          approvedAt: new Date(),
        },
      });
    });
  }

  async approveLeaveRequest(
    id: bigint,
    actingUserId: bigint,
  ) {
    return prisma.$transaction(async (tx: any) => {
      const request = await tx.leaveRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw new TimeOffServiceError(
          "LEAVE_REQUEST_NOT_FOUND",
          "Leave request not found",
          404,
        );
      }

      if (request.status !== "PENDING") {
        throw new TimeOffServiceError(
          "INVALID_REQUEST_STATUS",
          "Only PENDING leave requests can be approved",
        );
      }

      const requestedUnits = decimalNumber(request.requestedUnits);
      const leaveType = await tx.leaveType.findUnique({
        where: { id: request.leaveTypeId },
      });

      let allocationId = request.allocationId;

      if (leaveType?.requiresAllocation) {
        if (!allocationId) {
          const allocation = await tx.leaveAllocation.findFirst({
            where: {
              employeeId: request.employeeId,
              leaveTypeId: request.leaveTypeId,
              status: "APPROVED",
              validFrom: { lte: request.startDate },
              validTo: { gte: request.endDate },
            },
            orderBy: { validFrom: "asc" },
          });

          if (!allocation) {
            throw new TimeOffServiceError(
              "INSUFFICIENT_LEAVE_BALANCE",
              "Insufficient leave balance",
            );
          }

          allocationId = allocation.id;
        }

        const allocation = await tx.leaveAllocation.findUnique({
          where: { id: allocationId },
        });

        if (!allocation) {
          throw new TimeOffServiceError(
            "ALLOCATION_NOT_FOUND",
            "Leave allocation not found",
            404,
          );
        }

        const available = calculateAvailableUnits(
          decimalNumber(allocation.allocatedUnits),
          decimalNumber(allocation.usedUnits),
        );

        if (available < requestedUnits) {
          throw new TimeOffServiceError(
            "INSUFFICIENT_LEAVE_BALANCE",
            "Insufficient leave balance",
          );
        }

        await tx.leaveAllocation.update({
          where: { id: allocationId },
          data: {
            usedUnits: {
              increment: requestedUnits,
            },
          },
        });
      }

      return tx.leaveRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          allocationId: allocationId ?? null,
          approvedBy: actingUserId,
          approvedAt: new Date(),
        },
      });
    });
  }

  async rejectLeaveRequest(id: bigint) {
    return prisma.$transaction(async (tx: any) => {
      const request = await tx.leaveRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw new TimeOffServiceError(
          "LEAVE_REQUEST_NOT_FOUND",
          "Leave request not found",
          404,
        );
      }

      if (
        request.status !== "PENDING" &&
        request.status !== "APPROVED"
      ) {
        throw new TimeOffServiceError(
          "INVALID_REQUEST_STATUS",
          "Only PENDING or APPROVED leave requests can be rejected",
        );
      }

      if (request.status === "APPROVED" && request.allocationId) {
        const allocation = await tx.leaveAllocation.findUnique({
          where: { id: request.allocationId },
        });

        if (!allocation) {
          throw new TimeOffServiceError(
            "ALLOCATION_NOT_FOUND",
            "Associated allocation not found",
            404,
          );
        }

        const used = decimalNumber(allocation.usedUnits);
        const requested = decimalNumber(request.requestedUnits);

        await tx.leaveAllocation.update({
          where: { id: allocation.id },
          data: {
            usedUnits: Math.max(0, used - requested),
          },
        });
      }

      return tx.leaveRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
        },
      });
    });
  }

  async cancelLeaveRequest(
    id: bigint,
    employeeId: bigint,
  ) {
    return prisma.$transaction(async (tx: any) => {
      const request = await tx.leaveRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw new TimeOffServiceError(
          "LEAVE_REQUEST_NOT_FOUND",
          "Leave request not found",
          404,
        );
      }

      if (request.employeeId !== employeeId) {
        throw new TimeOffServiceError(
          "FORBIDDEN",
          "You can only cancel your own leave request",
          403,
        );
      }

      if (
        request.status !== "PENDING" &&
        request.status !== "APPROVED"
      ) {
        throw new TimeOffServiceError(
          "INVALID_REQUEST_STATUS",
          "Only PENDING or APPROVED leave requests can be cancelled",
        );
      }

      if (request.status === "APPROVED" && request.allocationId) {
        const allocation = await tx.leaveAllocation.findUnique({
          where: { id: request.allocationId },
        });

        if (!allocation) {
          throw new TimeOffServiceError(
            "ALLOCATION_NOT_FOUND",
            "Associated allocation not found",
            404,
          );
        }

        const used = decimalNumber(allocation.usedUnits);
        const requested = decimalNumber(request.requestedUnits);

        await tx.leaveAllocation.update({
          where: { id: allocation.id },
          data: {
            usedUnits: Math.max(0, used - requested),
          },
        });
      }

      return tx.leaveRequest.update({
        where: { id },
        data: {
          status: "CANCELLED",
        },
      });
    });
  }
}
