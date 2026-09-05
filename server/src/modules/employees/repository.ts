import prisma from '../../config/database';

export interface EmployeeFilterQuery {
  search?: string;
  departmentId?: bigint;
  positionId?: bigint;
  status?: string;
  type?: string;
  employeeId?: bigint; // For self-service scoping
  page?: number;
  limit?: number;
}

export class EmployeeRepository {
  static async findMany(filters: EmployeeFilterQuery) {
    const { search, departmentId, positionId, status, type, employeeId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (employeeId !== undefined) {
      where.id = employeeId;
    }

    if (departmentId !== undefined) {
      where.department_id = departmentId;
    }

    if (positionId !== undefined) {
      where.position_id = positionId;
    }

    if (status && status !== 'ALL') {
      where.employment_status = status as any;
    }

    if (type && type !== 'ALL') {
      where.employee_type = type as any;
    }

    if (search) {
      where.OR = [
        { employee_code: { contains: search, mode: 'insensitive' } },
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.employees.count({ where }),
      prisma.employees.findMany({
        where,
        skip,
        take: limit,
        orderBy: { first_name: 'asc' },
        include: {
          departments: true,
          job_positions: true,
          working_schedules: true,
          employees: {
            select: {
              id: true,
              employee_code: true,
              first_name: true,
              last_name: true,
            },
          },
          users: {
            select: {
              id: true,
              email: true,
              role: true,
              status: true,
            },
          },
          _count: {
            select: {
              contracts: true,
              attendance: true,
              leave_requests: true,
              leave_allocations: true,
            },
          },
        },
      }),
    ]);

    return { total, items };
  }

  static async findById(id: bigint) {
    return prisma.employees.findUnique({
      where: { id },
      include: {
        departments: true,
        job_positions: true,
        working_schedules: true,
        employees: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
        _count: {
          select: {
            contracts: true,
            attendance: true,
            leave_requests: true,
            leave_allocations: true,
          },
        },
      },
    });
  }

  static async findByUserId(userId: bigint) {
    return prisma.employees.findUnique({
      where: { user_id: userId },
    });
  }

  static async findByEmployeeCode(code: string, excludeId?: bigint) {
    return prisma.employees.findFirst({
      where: {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        employee_code: { equals: code, mode: 'insensitive' },
      },
    });
  }

  static async create(data: any) {
    return prisma.employees.create({
      data,
      include: {
        departments: true,
        job_positions: true,
        working_schedules: true,
        employees: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  static async update(id: bigint, data: any) {
    return prisma.employees.update({
      where: { id },
      data,
      include: {
        departments: true,
        job_positions: true,
        working_schedules: true,
        employees: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  static async delete(id: bigint) {
    return prisma.employees.delete({
      where: { id },
    });
  }
}
