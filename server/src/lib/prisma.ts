import prismaRaw from '../config/database';

function toDbFields(obj: any): any {
  if (!obj || typeof obj !== 'object' || obj instanceof Date || obj instanceof Uint8Array) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(toDbFields);
  }
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    let dbKey = key;
    if (key === 'requiresAllocation') dbKey = 'requires_allocation';
    else if (key === 'requiresApproval') dbKey = 'requires_approval';
    else if (key === 'payrollDeductible') dbKey = 'payroll_deductible';
    else if (key === 'maxConsecutiveUnits') dbKey = 'max_consecutive_units';
    else if (key === 'isActive') dbKey = 'is_active';
    else if (key === 'employeeId') dbKey = 'employee_id';
    else if (key === 'leaveTypeId') dbKey = 'leave_type_id';
    else if (key === 'allocationId') dbKey = 'allocation_id';
    else if (key === 'validFrom') dbKey = 'valid_from';
    else if (key === 'validTo') dbKey = 'valid_to';
    else if (key === 'allocatedUnits') dbKey = 'allocated_units';
    else if (key === 'usedUnits') dbKey = 'used_units';
    else if (key === 'startDate') dbKey = 'start_date';
    else if (key === 'endDate') dbKey = 'end_date';
    else if (key === 'requestedUnits') dbKey = 'requested_units';
    else if (key === 'approvedBy') dbKey = 'approved_by';
    else if (key === 'approvedAt') dbKey = 'approved_at';
    else if (key === 'createdAt') dbKey = 'created_at';
    else if (key === 'updatedAt') dbKey = 'updated_at';

    result[dbKey] = toDbFields(val);
  }
  return result;
}

function fromDbFields(obj: any): any {
  if (!obj || typeof obj !== 'object' || obj instanceof Date || obj instanceof Uint8Array) {
    return obj;
  }
  if (typeof obj.toNumber === 'function') {
    return obj.toNumber();
  }
  if ('d' in obj && Array.isArray(obj.d)) {
    return (obj.s ?? 1) * Number(obj.d.join(''));
  }
  if (Array.isArray(obj)) {
    return obj.map(fromDbFields);
  }
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    let jsKey = key;
    if (key === 'requires_allocation') jsKey = 'requiresAllocation';
    else if (key === 'requires_approval') jsKey = 'requiresApproval';
    else if (key === 'payroll_deductible') jsKey = 'payrollDeductible';
    else if (key === 'max_consecutive_units') jsKey = 'maxConsecutiveUnits';
    else if (key === 'is_active') jsKey = 'isActive';
    else if (key === 'employee_id') jsKey = 'employeeId';
    else if (key === 'leave_type_id') jsKey = 'leaveTypeId';
    else if (key === 'allocation_id') jsKey = 'allocationId';
    else if (key === 'valid_from') jsKey = 'validFrom';
    else if (key === 'valid_to') jsKey = 'validTo';
    else if (key === 'allocated_units') jsKey = 'allocatedUnits';
    else if (key === 'used_units') jsKey = 'usedUnits';
    else if (key === 'start_date') jsKey = 'startDate';
    else if (key === 'end_date') jsKey = 'endDate';
    else if (key === 'requested_units') jsKey = 'requestedUnits';
    else if (key === 'approved_by') jsKey = 'approvedBy';
    else if (key === 'approved_at') jsKey = 'approvedAt';
    else if (key === 'created_at') jsKey = 'createdAt';
    else if (key === 'updated_at') jsKey = 'updatedAt';

    result[jsKey] = fromDbFields(val);
  }

  // Also include enriched relations if available
  if (obj.employees) {
    result.employee = {
      id: obj.employees.id?.toString(),
      name: `${obj.employees.first_name || ''} ${obj.employees.last_name || ''}`.trim(),
      employeeCode: obj.employees.employee_code,
    };
  }
  if (obj.leave_types) {
    result.leaveType = {
      id: obj.leave_types.id?.toString(),
      name: obj.leave_types.name,
      code: obj.leave_types.code,
      unit: obj.leave_types.unit,
    };
  }

  return result;
}

function createModelProxy(modelDelegate: any, isAllocation = false, isRequest = false) {
  return {
    async findMany(args: any = {}) {
      const dbArgs = toDbFields(args);
      if (isAllocation || isRequest) {
        dbArgs.include = {
          ...(dbArgs.include || {}),
          employees: { select: { id: true, first_name: true, last_name: true, employee_code: true } },
          leave_types: { select: { id: true, name: true, code: true, unit: true } },
        };
      }
      const res = await modelDelegate.findMany(dbArgs);
      return fromDbFields(res);
    },
    async findUnique(args: any = {}) {
      const dbArgs = toDbFields(args);
      if (isAllocation || isRequest) {
        dbArgs.include = {
          ...(dbArgs.include || {}),
          employees: { select: { id: true, first_name: true, last_name: true, employee_code: true } },
          leave_types: { select: { id: true, name: true, code: true, unit: true } },
        };
      }
      const res = await modelDelegate.findUnique(dbArgs);
      return fromDbFields(res);
    },
    async findFirst(args: any = {}) {
      const dbArgs = toDbFields(args);
      if (isAllocation || isRequest) {
        dbArgs.include = {
          ...(dbArgs.include || {}),
          employees: { select: { id: true, first_name: true, last_name: true, employee_code: true } },
          leave_types: { select: { id: true, name: true, code: true, unit: true } },
        };
      }
      const res = await modelDelegate.findFirst(dbArgs);
      return fromDbFields(res);
    },
    async count(args: any = {}) {
      return modelDelegate.count(toDbFields(args));
    },
    async create(args: any = {}) {
      const res = await modelDelegate.create(toDbFields(args));
      return fromDbFields(res);
    },
    async update(args: any = {}) {
      const res = await modelDelegate.update(toDbFields(args));
      return fromDbFields(res);
    },
    async delete(args: any = {}) {
      const res = await modelDelegate.delete(toDbFields(args));
      return fromDbFields(res);
    },
  };
}

export function wrapPrismaClient(client: any): any {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === 'leaveType') return createModelProxy(target.leave_types);
      if (prop === 'leaveAllocation') return createModelProxy(target.leave_allocations, true, false);
      if (prop === 'leaveRequest') return createModelProxy(target.leave_requests, false, true);
      if (prop === 'employee') return createModelProxy(target.employees);
      if (prop === 'user') return createModelProxy(target.users);
      if (prop === '$transaction') {
        return async function (arg: any) {
          if (typeof arg === 'function') {
            return target.$transaction(async (tx: any) => {
              const wrappedTx = wrapPrismaClient(tx);
              return arg(wrappedTx);
            });
          }
          if (Array.isArray(arg)) {
            return Promise.all(arg);
          }
          return target.$transaction(arg);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

export const prisma: any = wrapPrismaClient(prismaRaw);
export default prisma;
