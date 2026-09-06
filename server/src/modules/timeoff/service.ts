import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
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
    const raw = value as Record<string, any>;
    const res: Record<string, any> = {};

    for (const [key, item] of Object.entries(raw)) {
      res[key] = serialize(item);
    }

    const emp = raw.employees || raw.employee;
    if (emp) {
      const firstName = emp.first_name ?? emp.firstName ?? "";
      const lastName = emp.last_name ?? emp.lastName ?? "";
      const name = `${firstName} ${lastName}`.trim() || emp.name;
      const employeeCode = emp.employee_code ?? emp.employeeCode ?? "";

      const employeeObj = {
        id: emp.id ? emp.id.toString() : undefined,
        employeeCode,
        firstName,
        lastName,
        name,
      };
      res.employee = employeeObj;
      res.employees = employeeObj;
    }

    const lt = raw.leave_types || raw.leaveType;
    if (lt) {
      const leaveTypeObj = {
        id: lt.id ? lt.id.toString() : undefined,
        name: lt.name,
        code: lt.code,
        unit: lt.unit,
      };
      res.leaveType = leaveTypeObj;
      res.leave_types = leaveTypeObj;
    }

    if (raw.employee_id !== undefined && res.employeeId === undefined) {
      res.employeeId = raw.employee_id.toString();
    }
    if (raw.leave_type_id !== undefined && res.leaveTypeId === undefined) {
      res.leaveTypeId = raw.leave_type_id.toString();
    }
    if (raw.allocation_id !== undefined && res.allocationId === undefined) {
      res.allocationId = raw.allocation_id ? raw.allocation_id.toString() : null;
    }
    if (raw.start_date !== undefined && res.startDate === undefined) {
      res.startDate = raw.start_date instanceof Date ? raw.start_date.toISOString().split("T")[0] : raw.start_date;
    }
    if (raw.end_date !== undefined && res.endDate === undefined) {
      res.endDate = raw.end_date instanceof Date ? raw.end_date.toISOString().split("T")[0] : raw.end_date;
    }
    if (raw.requested_units !== undefined && res.requestedUnits === undefined) {
      res.requestedUnits = decimalNumber(raw.requested_units);
    }
    if (raw.allocated_units !== undefined && res.allocatedUnits === undefined) {
      res.allocatedUnits = decimalNumber(raw.allocated_units);
    }
    if (raw.used_units !== undefined && res.usedUnits === undefined) {
      res.usedUnits = decimalNumber(raw.used_units);
    }
    if (raw.valid_from !== undefined && res.validFrom === undefined) {
      res.validFrom = raw.valid_from instanceof Date ? raw.valid_from.toISOString().split("T")[0] : raw.valid_from;
    }
    if (raw.valid_to !== undefined && res.validTo === undefined) {
      res.validTo = raw.valid_to instanceof Date ? raw.valid_to.toISOString().split("T")[0] : raw.valid_to;
    }
    if (raw.approved_by !== undefined && res.approvedBy === undefined) {
      res.approvedBy = raw.approved_by ? raw.approved_by.toString() : null;
    }
    if (raw.approved_at !== undefined && res.approvedAt === undefined) {
      res.approvedAt = raw.approved_at instanceof Date ? raw.approved_at.toISOString() : raw.approved_at;
    }

    return res;
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
    return prisma.leave_types.findMany({
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
          : { is_active: input.isActive }),
      },
      orderBy: { name: "asc" },
    });
  }

  async createLeaveType(input: LeaveTypeCreateInput) {
    try {
      return await prisma.leave_types.create({
        data: {
          name: input.name,
          code: input.code.toUpperCase(),
          unit: input.unit,
          requires_allocation: input.requiresAllocation,
          requires_approval: input.requiresApproval,
          payroll_deductible: input.payrollDeductible,
          max_consecutive_units: input.maxConsecutiveUnits,
          is_active: input.isActive,
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
      return await prisma.leave_types.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.code !== undefined
            ? { code: input.code.toUpperCase() }
            : {}),
          ...(input.unit !== undefined ? { unit: input.unit } : {}),
          ...(input.requiresAllocation !== undefined
            ? { requires_allocation: input.requiresAllocation }
            : {}),
          ...(input.requiresApproval !== undefined
            ? { requires_approval: input.requiresApproval }
            : {}),
          ...(input.payrollDeductible !== undefined
            ? { payroll_deductible: input.payrollDeductible }
            : {}),
          ...(input.maxConsecutiveUnits !== undefined
            ? { max_consecutive_units: input.maxConsecutiveUnits }
            : {}),
          ...(input.isActive !== undefined
            ? { is_active: input.isActive }
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
      return await prisma.leave_types.delete({
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
    const employee_id = currentEmployeeId ?? input.employeeId;

    const where = {
      ...(employee_id !== undefined ? { employee_id } : {}),
      ...(input.leaveTypeId !== undefined
        ? { leave_type_id: input.leaveTypeId }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    };

    const skip = (input.page - 1) * input.limit;

    const [data, total] = await prisma.$transaction([
      prisma.leave_allocations.findMany({
        where,
        orderBy: [{ valid_from: "desc" }, { id: "desc" }],
        skip,
        take: input.limit,
        include: {
          employees: {
            select: {
              id: true,
              employee_code: true,
              first_name: true,
              last_name: true,
            },
          },
          leave_types: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
            },
          },
        },
      }),
      prisma.leave_allocations.count({ where }),
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
    const allocation = await prisma.leave_allocations.findUnique({
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
        leave_types: {
          select: {
            id: true,
            name: true,
            code: true,
            unit: true,
          },
        },
      },
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
      allocation.employee_id !== currentEmployeeId
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
    const employee = await prisma.employees.findUnique({
      where: { id: input.employeeId },
    });

    if (!employee) {
      throw new TimeOffServiceError(
        "EMPLOYEE_NOT_FOUND",
        "Employee not found",
        404,
      );
    }

    const leaveType = await prisma.leave_types.findUnique({
      where: { id: input.leaveTypeId },
    });

    if (!leaveType) {
      throw new TimeOffServiceError(
        "LEAVE_TYPE_NOT_FOUND",
        "Leave type not found",
        404,
      );
    }

    if (!leaveType.is_active) {
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

    return prisma.leave_allocations.create({
      data: {
        employee_id: input.employeeId,
        leave_type_id: input.leaveTypeId,
        valid_from: toDate(input.validFrom),
        valid_to: toDate(input.validTo),
        allocated_units: input.allocatedUnits,
        used_units: 0,
        status: input.status,
        ...(input.status === "APPROVED"
          ? {
              approved_by: actingUserId,
              approved_at: new Date(),
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
    const allocation = await prisma.leave_allocations.findUnique({
      where: { id },
    });

    if (!allocation) {
      throw new TimeOffServiceError(
        "ALLOCATION_NOT_FOUND",
        "Leave allocation not found",
        404,
      );
    }

    const currentAllocated = decimalNumber(allocation.allocated_units);
    const currentUsed = decimalNumber(allocation.used_units);

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
      : allocation.valid_from;

    const validTo = input.validTo
      ? toDate(input.validTo)
      : allocation.valid_to;

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

    return prisma.leave_allocations.update({
      where: { id },
      data: {
        valid_from: validFrom,
        valid_to: validTo,
        allocated_units: allocatedUnits,
        status: nextStatus,
        ...(approving
          ? {
              approved_by: actingUserId,
              approved_at: new Date(),
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
    const employee_id = currentEmployeeId ?? input.employeeId;

    const where = {
      ...(employee_id !== undefined ? { employee_id } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.startDate || input.endDate
        ? {
            start_date: {
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
      prisma.leave_requests.findMany({
        where,
        orderBy: [{ start_date: "desc" }, { id: "desc" }],
        skip,
        take: input.limit,
        include: {
          employees: {
            select: {
              id: true,
              employee_code: true,
              first_name: true,
              last_name: true,
            },
          },
          leave_types: {
            select: {
              id: true,
              name: true,
              code: true,
              unit: true,
            },
          },
        },
      }),
      prisma.leave_requests.count({ where }),
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
    const request = await prisma.leave_requests.findUnique({
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
        leave_types: {
          select: {
            id: true,
            name: true,
            code: true,
            unit: true,
          },
        },
      },
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
      request.employee_id !== currentEmployeeId
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
    const employee = await prisma.employees.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new TimeOffServiceError(
        "EMPLOYEE_NOT_FOUND",
        "Employee not found",
        404,
      );
    }

    const leaveType = await prisma.leave_types.findUnique({
      where: { id: input.leaveTypeId },
    });

    if (!leaveType) {
      throw new TimeOffServiceError(
        "LEAVE_TYPE_NOT_FOUND",
        "Leave type not found",
        404,
      );
    }

    if (!leaveType.is_active) {
      throw new TimeOffServiceError(
        "LEAVE_TYPE_INACTIVE",
        "Cannot request an inactive leave type",
      );
    }

    if (
      leaveType.max_consecutive_units !== null &&
      leaveType.max_consecutive_units !== undefined &&
      input.requestedUnits >
        decimalNumber(leaveType.max_consecutive_units)
    ) {
      throw new TimeOffServiceError(
        "MAX_CONSECUTIVE_LIMIT",
        `Requested units exceed the maximum consecutive limit of ${decimalNumber(
          leaveType.max_consecutive_units,
        )}`,
      );
    }

    const allocation = leaveType.requires_allocation
      ? await this.findSufficientAllocation(
          employeeId,
          input.leaveTypeId,
          input.startDate,
          input.endDate,
          input.requestedUnits,
        )
      : null;

    if (leaveType.requires_allocation && !allocation) {
      throw new TimeOffServiceError(
        "INSUFFICIENT_LEAVE_BALANCE",
        "Insufficient leave balance",
      );
    }

    if (!leaveType.requires_approval) {
      return this.approveNewRequestImmediately(
        input,
        employeeId,
        actingUserId,
        allocation?.id,
      );
    }

    return prisma.leave_requests.create({
      data: {
        employee_id: employeeId,
        leave_type_id: input.leaveTypeId,
        allocation_id: allocation?.id ?? null,
        start_date: toDate(input.startDate),
        end_date: toDate(input.endDate),
        requested_units: input.requestedUnits,
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
    const allocations = await prisma.leave_allocations.findMany({
      where: {
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        status: "APPROVED",
        valid_from: { lte: toDate(startDate) },
        valid_to: { gte: toDate(endDate) },
      },
      orderBy: { valid_from: "asc" },
    });

    return (
      allocations.find((allocation: any) => {
        const available = calculateAvailableUnits(
          decimalNumber(allocation.allocated_units),
          decimalNumber(allocation.used_units),
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
        const allocation = await tx.leave_allocations.findUnique({
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
          decimalNumber(allocation.allocated_units),
          decimalNumber(allocation.used_units),
        );

        if (available < input.requestedUnits) {
          throw new TimeOffServiceError(
            "INSUFFICIENT_LEAVE_BALANCE",
            "Insufficient leave balance",
          );
        }

        await tx.leave_allocations.update({
          where: { id: allocationId },
          data: {
            used_units: {
              increment: input.requestedUnits,
            },
          },
        });
      }

      return tx.leave_requests.create({
        data: {
          employee_id: employeeId,
          leave_type_id: input.leaveTypeId,
          allocation_id: allocationId ?? null,
          start_date: toDate(input.startDate),
          end_date: toDate(input.endDate),
          requested_units: input.requestedUnits,
          reason: input.reason,
          status: "APPROVED",
          approved_by: actingUserId,
          approved_at: new Date(),
        },
      });
    });
  }

  async approveLeaveRequest(
    id: bigint,
    actingUserId: bigint,
  ) {
    return prisma.$transaction(async (tx: any) => {
      const request = await tx.leave_requests.findUnique({
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

      const requestedUnits = decimalNumber(request.requested_units);
      const leaveType = await tx.leave_types.findUnique({
        where: { id: request.leave_type_id },
      });

      let allocationId = request.allocation_id;

      if (leaveType?.requires_allocation) {
        let allocation = allocationId
          ? await tx.leave_allocations.findUnique({ where: { id: allocationId } })
          : null;

        if (!allocation) {
          allocation = await tx.leave_allocations.findFirst({
            where: {
              employee_id: request.employee_id,
              leave_type_id: request.leave_type_id,
            },
            orderBy: { valid_from: "desc" },
          });
        }

        if (allocation) {
          allocationId = allocation.id;
          const currentAllocated = decimalNumber(allocation.allocated_units);
          const currentUsed = decimalNumber(allocation.used_units);
          const neededAllocated = Math.max(currentAllocated, currentUsed + requestedUnits);

          await tx.leave_allocations.update({
            where: { id: allocationId },
            data: {
              status: "APPROVED",
              allocated_units: neededAllocated,
              used_units: {
                increment: requestedUnits,
              },
            },
          });
        } else {
          const reqYear = request.start_date.getFullYear();
          const newAlloc = await tx.leave_allocations.create({
            data: {
              employee_id: request.employee_id,
              leave_type_id: request.leave_type_id,
              valid_from: new Date(`${reqYear}-01-01T00:00:00.000Z`),
              valid_to: new Date(`${reqYear}-12-31T23:59:59.999Z`),
              allocated_units: Math.max(20, requestedUnits),
              used_units: requestedUnits,
              status: "APPROVED",
              approved_by: actingUserId,
              approved_at: new Date(),
            },
          });
          allocationId = newAlloc.id;
        }
      }

      return tx.leave_requests.update({
        where: { id },
        data: {
          status: "APPROVED",
          allocation_id: allocationId ?? null,
          approved_by: actingUserId,
          approved_at: new Date(),
        },
      });
    });
  }

  async rejectLeaveRequest(id: bigint) {
    return prisma.$transaction(async (tx: any) => {
      const request = await tx.leave_requests.findUnique({
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

      if (request.status === "APPROVED" && request.allocation_id) {
        const allocation = await tx.leave_allocations.findUnique({
          where: { id: request.allocation_id },
        });

        if (allocation) {
          const used = decimalNumber(allocation.used_units);
          const requested = decimalNumber(request.requested_units);

          await tx.leave_allocations.update({
            where: { id: allocation.id },
            data: {
              used_units: Math.max(0, used - requested),
            },
          });
        }
      }

      return tx.leave_requests.update({
        where: { id },
        data: {
          status: "REJECTED",
        },
      });
    });
  }

  async cancelLeaveRequest(
    id: bigint,
    currentEmployeeId?: bigint,
    isManager: boolean = false,
  ) {
    return prisma.$transaction(async (tx: any) => {
      const request = await tx.leave_requests.findUnique({
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
        !isManager &&
        (currentEmployeeId === undefined || request.employee_id !== currentEmployeeId)
      ) {
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

      if (request.status === "APPROVED" && request.allocation_id) {
        const allocation = await tx.leave_allocations.findUnique({
          where: { id: request.allocation_id },
        });

        if (allocation) {
          const used = decimalNumber(allocation.used_units);
          const requested = decimalNumber(request.requested_units);

          await tx.leave_allocations.update({
            where: { id: allocation.id },
            data: {
              used_units: Math.max(0, used - requested),
            },
          });
        }
      }

      return tx.leave_requests.update({
        where: { id },
        data: {
          status: "CANCELLED",
        },
      });
    });
  }
}
