import prisma from '../../config/database';
import bcrypt from 'bcryptjs';
import { EmployeeRepository } from './repository';
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeeFilterInput,
} from './validation';
import { AuthenticatedUser } from '../../middleware/auth';

function formatDateString(date?: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

function formatEmployee(emp: any) {
  if (!emp) return null;

  return {
    id: emp.id.toString(),
    employeeCode: emp.employee_code,
    firstName: emp.first_name,
    lastName: emp.last_name,
    fullName: `${emp.first_name} ${emp.last_name}`.trim(),
    name: `${emp.first_name} ${emp.last_name}`.trim(),
    phone: emp.phone || null,
    dateOfBirth: formatDateString(emp.date_of_birth),
    hireDate: formatDateString(emp.hire_date) || new Date().toISOString().split('T')[0],
    terminationDate: formatDateString(emp.termination_date),
    employeeType: emp.employee_type,
    employmentStatus: emp.employment_status,
    departmentId: emp.department_id ? emp.department_id.toString() : null,
    department: emp.departments
      ? {
          id: emp.departments.id.toString(),
          name: emp.departments.name,
          code: emp.departments.code,
        }
      : null,
    positionId: emp.position_id ? emp.position_id.toString() : null,
    position: emp.job_positions
      ? {
          id: emp.job_positions.id.toString(),
          title: emp.job_positions.title,
        }
      : null,
    scheduleId: emp.schedule_id ? emp.schedule_id.toString() : null,
    schedule: emp.working_schedules
      ? {
          id: emp.working_schedules.id.toString(),
          name: emp.working_schedules.name,
          weeklyHours: Number(emp.working_schedules.weekly_hours),
        }
      : null,
    managerId: emp.manager_id ? emp.manager_id.toString() : null,
    manager: emp.employees
      ? {
          id: emp.employees.id.toString(),
          employeeCode: emp.employees.employee_code,
          name: `${emp.employees.first_name} ${emp.employees.last_name}`.trim(),
        }
      : null,
    userId: emp.user_id ? emp.user_id.toString() : null,
    user: emp.users
      ? {
          id: emp.users.id.toString(),
          email: emp.users.email,
          role: emp.users.role,
          status: emp.users.status,
        }
      : null,
    email: emp.users?.email || null,
    bankAccountName: emp.bank_account_name || null,
    bankAccountNumber: emp.bank_account_number || null,
    bankName: emp.bank_name || null,
    ifscCode: emp.ifsc_code || null,
    totalAttendance: emp._count?.attendance ?? 0,
    totalContracts: emp._count?.contracts ?? 0,
    createdAt: emp.created_at,
    updatedAt: emp.updated_at,
  };
}

export class EmployeeService {
  static async listEmployees(filters: EmployeeFilterInput, user?: AuthenticatedUser) {
    const { page = 1, limit = 20, departmentId, positionId, status, type, search } = filters;

    let targetEmployeeId: bigint | undefined;

    // RBAC Self-Service Restriction for EMPLOYEE role
    if (user && user.role === 'EMPLOYEE') {
      if (!user.employeeId) {
        return {
          items: [],
          meta: { page: 1, limit, total: 0, totalPages: 0 },
        };
      }
      targetEmployeeId = BigInt(user.employeeId);
    }

    const { total, items } = await EmployeeRepository.findMany({
      search,
      departmentId: departmentId ? BigInt(departmentId) : undefined,
      positionId: positionId ? BigInt(positionId) : undefined,
      status,
      type,
      employeeId: targetEmployeeId,
      page,
      limit,
    });

    return {
      items: items.map(formatEmployee),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getEmployeeById(id: bigint, user?: AuthenticatedUser) {
    // RBAC Self-Service Restriction for EMPLOYEE role
    if (user && user.role === 'EMPLOYEE') {
      if (!user.employeeId || user.employeeId !== id.toString()) {
        const error = new Error('You do not have permission to access another employee record');
        (error as any).code = 'FORBIDDEN';
        throw error;
      }
    }

    const employee = await EmployeeRepository.findById(id);
    if (!employee) {
      return null;
    }

    return formatEmployee(employee);
  }

  static async validateForeignKeys(data: {
    departmentId?: string | null;
    positionId?: string | null;
    scheduleId?: string | null;
    managerId?: string | null;
    userId?: string | null;
  }) {
    if (data.departmentId) {
      const dept = await prisma.departments.findUnique({ where: { id: BigInt(data.departmentId) } });
      if (!dept) {
        const error = new Error(`Department with ID ${data.departmentId} does not exist`);
        (error as any).code = 'INVALID_REFERENCE';
        throw error;
      }
    }

    if (data.positionId) {
      const pos = await prisma.job_positions.findUnique({ where: { id: BigInt(data.positionId) } });
      if (!pos) {
        const error = new Error(`Job Position with ID ${data.positionId} does not exist`);
        (error as any).code = 'INVALID_REFERENCE';
        throw error;
      }
    }

    if (data.scheduleId) {
      const sched = await prisma.working_schedules.findUnique({ where: { id: BigInt(data.scheduleId) } });
      if (!sched) {
        const error = new Error(`Working Schedule with ID ${data.scheduleId} does not exist`);
        (error as any).code = 'INVALID_REFERENCE';
        throw error;
      }
    }

    if (data.managerId) {
      const mgr = await prisma.employees.findUnique({ where: { id: BigInt(data.managerId) } });
      if (!mgr) {
        const error = new Error(`Manager with ID ${data.managerId} does not exist`);
        (error as any).code = 'INVALID_REFERENCE';
        throw error;
      }
    }

    if (data.userId) {
      const u = await prisma.users.findUnique({ where: { id: BigInt(data.userId) } });
      if (!u) {
        const error = new Error(`User account with ID ${data.userId} does not exist`);
        (error as any).code = 'INVALID_REFERENCE';
        throw error;
      }
    }
  }

  static async createEmployee(input: CreateEmployeeInput) {
    let employeeCode = input.employeeCode?.trim();

    // Auto-generate employee code if omitted
    if (!employeeCode) {
      const count = await prisma.employees.count();
      employeeCode = `EMP${String(count + 1).padStart(4, "0")}`;
      let exists = await EmployeeRepository.findByEmployeeCode(employeeCode);
      let counter = count + 1;
      while (exists) {
        counter++;
        employeeCode = `EMP${String(counter).padStart(4, "0")}`;
        exists = await EmployeeRepository.findByEmployeeCode(employeeCode);
      }
    } else {
      const existingCode = await EmployeeRepository.findByEmployeeCode(employeeCode);
      if (existingCode) {
        const error = new Error(`Employee with code ${employeeCode} already exists`);
        (error as any).code = 'DUPLICATE_RESOURCE';
        throw error;
      }
    }

    // Handle optional user creation or linking if email is provided
    let linkedUserId: bigint | null = input.userId ? BigInt(input.userId) : null;
    if (!linkedUserId && input.email) {
      const normalizedEmail = input.email.toLowerCase().trim();
      let user = await prisma.users.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        const defaultHash = await bcrypt.hash("Password123!", 10);
        user = await prisma.users.create({
          data: {
            email: normalizedEmail,
            full_name: `${input.firstName} ${input.lastName}`.trim(),
            password_hash: defaultHash,
            role: "EMPLOYEE",
            status: "ACTIVE",
          },
        });
      }
      linkedUserId = user.id;
    }

    if (linkedUserId) {
      const existingUserLink = await EmployeeRepository.findByUserId(linkedUserId);
      if (existingUserLink) {
        const error = new Error(`User ID ${linkedUserId} is already associated with another employee`);
        (error as any).code = 'DUPLICATE_RESOURCE';
        throw error;
      }
    }

    // Validate referenced foreign keys
    await this.validateForeignKeys({
      departmentId: input.departmentId,
      positionId: input.positionId,
      scheduleId: input.scheduleId,
      managerId: input.managerId,
      userId: linkedUserId ? linkedUserId.toString() : undefined,
    });

    const created = await EmployeeRepository.create({
      employee_code: employeeCode,
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone ?? null,
      date_of_birth: input.dateOfBirth ?? null,
      hire_date: input.hireDate,
      termination_date: input.terminationDate ?? null,
      employee_type: input.employeeType ?? 'FULL_TIME',
      employment_status: input.employmentStatus ?? 'ACTIVE',
      department_id: input.departmentId ? BigInt(input.departmentId) : null,
      position_id: input.positionId ? BigInt(input.positionId) : null,
      manager_id: input.managerId ? BigInt(input.managerId) : null,
      schedule_id: input.scheduleId ? BigInt(input.scheduleId) : null,
      user_id: linkedUserId,
      bank_account_name: input.bankAccountName ?? null,
      bank_account_number: input.bankAccountNumber ?? null,
      bank_name: input.bankName ?? null,
      ifsc_code: input.ifscCode ?? null,
    } as any);

    return formatEmployee(created);
  }

  static async updateEmployee(id: bigint, input: UpdateEmployeeInput) {
    const existing = await EmployeeRepository.findById(id);
    if (!existing) {
      const error = new Error('Employee not found');
      (error as any).code = 'NOT_FOUND';
      throw error;
    }

    if (input.employeeCode) {
      const conflict = await EmployeeRepository.findByEmployeeCode(input.employeeCode, id);
      if (conflict) {
        const error = new Error(`Another employee with code ${input.employeeCode} already exists`);
        (error as any).code = 'DUPLICATE_RESOURCE';
        throw error;
      }
    }

    let linkedUserId: bigint | null | undefined = input.userId ? BigInt(input.userId) : undefined;
    if (linkedUserId) {
      const existingUserLink = await EmployeeRepository.findByUserId(linkedUserId);
      if (existingUserLink && existingUserLink.id !== id) {
        const error = new Error(`User ID ${input.userId} is already associated with another employee`);
        (error as any).code = 'DUPLICATE_RESOURCE';
        throw error;
      }
    }

    await this.validateForeignKeys({
      departmentId: input.departmentId,
      positionId: input.positionId,
      scheduleId: input.scheduleId,
      managerId: input.managerId,
      userId: linkedUserId ? linkedUserId.toString() : undefined,
    });

    const updateData: any = {};
    if (input.employeeCode !== undefined) updateData.employee_code = input.employeeCode;
    if (input.firstName !== undefined) updateData.first_name = input.firstName;
    if (input.lastName !== undefined) updateData.last_name = input.lastName;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.dateOfBirth !== undefined) updateData.date_of_birth = input.dateOfBirth;
    if (input.hireDate !== undefined) updateData.hire_date = input.hireDate;
    if (input.terminationDate !== undefined) updateData.termination_date = input.terminationDate;
    if (input.employeeType !== undefined) updateData.employee_type = input.employeeType;
    if (input.employmentStatus !== undefined) updateData.employment_status = input.employmentStatus;
    if (input.departmentId !== undefined) updateData.department_id = input.departmentId ? BigInt(input.departmentId) : null;
    if (input.positionId !== undefined) updateData.position_id = input.positionId ? BigInt(input.positionId) : null;
    if (input.managerId !== undefined) updateData.manager_id = input.managerId ? BigInt(input.managerId) : null;
    if (input.scheduleId !== undefined) updateData.schedule_id = input.scheduleId ? BigInt(input.scheduleId) : null;
    if (linkedUserId !== undefined) updateData.user_id = linkedUserId;
    if (input.bankAccountName !== undefined) updateData.bank_account_name = input.bankAccountName;
    if (input.bankAccountNumber !== undefined) updateData.bank_account_number = input.bankAccountNumber;
    if (input.bankName !== undefined) updateData.bank_name = input.bankName;
    if (input.ifscCode !== undefined) updateData.ifsc_code = input.ifscCode;

    const updated = await EmployeeRepository.update(id, updateData);
    return formatEmployee(updated);
  }

  static async deleteEmployee(id: bigint) {
    const existing = await EmployeeRepository.findById(id);
    if (!existing) {
      const error = new Error('Employee not found');
      (error as any).code = 'NOT_FOUND';
      throw error;
    }

    const hasRelations =
      existing._count.contracts > 0 ||
      existing._count.attendance > 0 ||
      existing._count.leave_requests > 0 ||
      existing._count.leave_allocations > 0;

    if (hasRelations) {
      const terminated = await EmployeeRepository.update(id, {
        employment_status: 'TERMINATED',
        termination_date: new Date(),
      });

      return {
        id: terminated.id.toString(),
        employeeCode: terminated.employee_code,
        fullName: `${terminated.first_name} ${terminated.last_name}`.trim(),
        employmentStatus: 'TERMINATED',
        action: 'DEACTIVATED',
        message: 'Employee has related historical records and was terminated instead of deleted.',
      };
    }

    await EmployeeRepository.delete(id);

    return {
      id: id.toString(),
      action: 'DELETED',
      message: 'Employee deleted successfully.',
    };
  }

  // Backwards compatibility instance methods
  async create(input: CreateEmployeeInput) { return EmployeeService.createEmployee(input); }
  async list(input: EmployeeFilterInput, user?: AuthenticatedUser) { return EmployeeService.listEmployees(input, user); }
  async getById(id: bigint, user?: AuthenticatedUser) { return EmployeeService.getEmployeeById(id, user); }
  async update(id: bigint, input: UpdateEmployeeInput) { return EmployeeService.updateEmployee(id, input); }
  async delete(id: bigint) { return EmployeeService.deleteEmployee(id); }
}
