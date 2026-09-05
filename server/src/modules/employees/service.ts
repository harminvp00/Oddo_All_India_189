import prisma from "../../config/database";
import bcrypt from "bcryptjs";
import { CreateEmployeeInput, UpdateEmployeeInput, EmployeeQueryInput } from "./validation";

export class EmployeeServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "EmployeeServiceError";
  }
}

export class EmployeeService {
  async create(input: CreateEmployeeInput) {
    let employeeCode = input.employeeCode?.trim();

    // Auto-generate employee code if missing
    if (!employeeCode) {
      const count = await prisma.employees.count();
      employeeCode = `EMP${String(count + 1).padStart(4, "0")}`;
      
      // Ensure unique
      let exists = await prisma.employees.findUnique({ where: { employee_code: employeeCode } });
      let counter = count + 1;
      while (exists) {
        counter++;
        employeeCode = `EMP${String(counter).padStart(4, "0")}`;
        exists = await prisma.employees.findUnique({ where: { employee_code: employeeCode } });
      }
    } else {
      const existing = await prisma.employees.findUnique({ where: { employee_code: employeeCode } });
      if (existing) {
        throw new EmployeeServiceError(409, "EMPLOYEE_CODE_EXISTS", "Employee code already in use");
      }
    }

    // Handle optional user account linking
    let linkedUserId: bigint | null = null;
    if (input.email) {
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

    const hireDate = new Date(input.hireDate);
    const dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;

    const departmentId = input.departmentId ? BigInt(input.departmentId) : null;
    const positionId = input.positionId ? BigInt(input.positionId) : null;
    const managerId = input.managerId ? BigInt(input.managerId) : null;
    const scheduleId = input.scheduleId ? BigInt(input.scheduleId) : null;

    return prisma.employees.create({
      data: {
        employee_code: employeeCode,
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        phone: input.phone?.trim() || null,
        date_of_birth: dateOfBirth,
        hire_date: hireDate,
        employee_type: input.employeeType,
        employment_status: input.employmentStatus,
        department_id: departmentId,
        position_id: positionId,
        manager_id: managerId,
        schedule_id: scheduleId,
        user_id: linkedUserId,
        bank_account_name: input.bankAccountName?.trim() || null,
        bank_account_number: input.bankAccountNumber?.trim() || null,
        bank_name: input.bankName?.trim() || null,
        ifsc_code: input.ifscCode?.trim() || null,
      },
      include: {
        departments: true,
        job_positions: true,
        working_schedules: true,
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
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
  }

  async list(input: EmployeeQueryInput) {
    const page = input.page || 1;
    const limit = input.limit || 20;
    const where: any = {};

    if (input.search) {
      const q = input.search.trim();
      where.OR = [
        { first_name: { contains: q, mode: "insensitive" } },
        { last_name: { contains: q, mode: "insensitive" } },
        { employee_code: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { users: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (input.departmentId) {
      where.department_id = BigInt(input.departmentId);
    }

    if (input.positionId) {
      where.position_id = BigInt(input.positionId);
    }

    if (input.status && input.status !== "all") {
      where.employment_status = input.status;
    }

    const [items, total] = await prisma.$transaction([
      prisma.employees.findMany({
        where,
        orderBy: { id: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          departments: true,
          job_positions: true,
          working_schedules: true,
          users: {
            select: {
              id: true,
              email: true,
              role: true,
              status: true,
            },
          },
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
      prisma.employees.count({ where }),
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

  async getById(id: bigint) {
    const employee = await prisma.employees.findUnique({
      where: { id },
      include: {
        departments: true,
        job_positions: true,
        working_schedules: true,
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
        employees: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
          },
        },
        _count: {
          select: {
            attendance: true,
            contracts: true,
          },
        },
      },
    });

    if (!employee) {
      throw new EmployeeServiceError(404, "EMPLOYEE_NOT_FOUND", "Employee not found");
    }

    return employee;
  }

  async update(id: bigint, input: UpdateEmployeeInput) {
    const existing = await prisma.employees.findUnique({ where: { id } });
    if (!existing) {
      throw new EmployeeServiceError(404, "EMPLOYEE_NOT_FOUND", "Employee not found");
    }

    if (input.employeeCode && input.employeeCode !== existing.employee_code) {
      const duplicate = await prisma.employees.findUnique({
        where: { employee_code: input.employeeCode },
      });
      if (duplicate) {
        throw new EmployeeServiceError(409, "EMPLOYEE_CODE_EXISTS", "Employee code already in use");
      }
    }

    const data: any = {};
    if (input.employeeCode !== undefined) data.employee_code = input.employeeCode.trim();
    if (input.firstName !== undefined) data.first_name = input.firstName.trim();
    if (input.lastName !== undefined) data.last_name = input.lastName.trim();
    if (input.phone !== undefined) data.phone = input.phone ? input.phone.trim() : null;
    if (input.dateOfBirth !== undefined) data.date_of_birth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
    if (input.hireDate !== undefined) data.hire_date = new Date(input.hireDate);
    if (input.terminationDate !== undefined) data.termination_date = input.terminationDate ? new Date(input.terminationDate) : null;
    if (input.employeeType !== undefined) data.employee_type = input.employeeType;
    if (input.employmentStatus !== undefined) data.employment_status = input.employmentStatus;

    if (input.departmentId !== undefined) data.department_id = input.departmentId ? BigInt(input.departmentId) : null;
    if (input.positionId !== undefined) data.position_id = input.positionId ? BigInt(input.positionId) : null;
    if (input.managerId !== undefined) data.manager_id = input.managerId ? BigInt(input.managerId) : null;
    if (input.scheduleId !== undefined) data.schedule_id = input.scheduleId ? BigInt(input.scheduleId) : null;

    if (input.bankAccountName !== undefined) data.bank_account_name = input.bankAccountName ? input.bankAccountName.trim() : null;
    if (input.bankAccountNumber !== undefined) data.bank_account_number = input.bankAccountNumber ? input.bankAccountNumber.trim() : null;
    if (input.bankName !== undefined) data.bank_name = input.bankName ? input.bankName.trim() : null;
    if (input.ifscCode !== undefined) data.ifsc_code = input.ifscCode ? input.ifscCode.trim() : null;

    return prisma.employees.update({
      where: { id },
      data,
      include: {
        departments: true,
        job_positions: true,
        working_schedules: true,
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
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
  }

  async delete(id: bigint) {
    const existing = await prisma.employees.findUnique({ where: { id } });
    if (!existing) {
      throw new EmployeeServiceError(404, "EMPLOYEE_NOT_FOUND", "Employee not found");
    }

    return prisma.employees.update({
      where: { id },
      data: { employment_status: "TERMINATED" },
    });
  }
}
