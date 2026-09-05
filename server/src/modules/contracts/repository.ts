import prisma from '../../config/database';
import { Prisma } from '../../generated/prisma/client';

export interface ContractFilterQuery {
  employeeId?: bigint;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class ContractRepository {
  static async findMany(filters: ContractFilterQuery) {
    const { employeeId, status, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.contractsWhereInput = {};

    if (employeeId !== undefined) {
      where.employee_id = employeeId;
    }

    if (status && status !== 'ALL') {
      where.status = status as any;
    }

    if (search) {
      where.OR = [
        { contract_number: { contains: search, mode: 'insensitive' } },
        { employees: { first_name: { contains: search, mode: 'insensitive' } } },
        { employees: { last_name: { contains: search, mode: 'insensitive' } } },
        { employees: { employee_code: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.contracts.count({ where }),
      prisma.contracts.findMany({
        where,
        skip,
        take: limit,
        orderBy: { start_date: 'desc' },
        include: {
          employees: {
            select: {
              id: true,
              employee_code: true,
              first_name: true,
              last_name: true,
            },
          },
          salary_structures: {
            select: {
              id: true,
              name: true,
            },
          },
          departments: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          job_positions: {
            select: {
              id: true,
              title: true,
            },
          },
          working_schedules: {
            select: {
              id: true,
              name: true,
              weekly_hours: true,
            },
          },
          _count: {
            select: {
              payslips: true,
            },
          },
        },
      }),
    ]);

    return { total, items };
  }

  static async findById(id: bigint) {
    return prisma.contracts.findUnique({
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
        salary_structures: {
          select: {
            id: true,
            name: true,
          },
        },
        departments: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        job_positions: {
          select: {
            id: true,
            title: true,
          },
        },
        working_schedules: {
          select: {
            id: true,
            name: true,
            weekly_hours: true,
          },
        },
        _count: {
          select: {
            payslips: true,
          },
        },
      },
    });
  }

  static async findByContractNumber(contractNumber: string, excludeId?: bigint) {
    return prisma.contracts.findFirst({
      where: {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        contract_number: { equals: contractNumber, mode: 'insensitive' },
      },
    });
  }

  static async findActiveContractsByEmployee(employeeId: bigint, excludeId?: bigint) {
    return prisma.contracts.findMany({
      where: {
        employee_id: employeeId,
        status: 'ACTIVE',
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  static async findApplicableContract(employeeId: bigint, periodStart: Date, periodEnd: Date) {
    return prisma.contracts.findFirst({
      where: {
        employee_id: employeeId,
        status: 'ACTIVE',
        start_date: { lte: periodEnd },
        OR: [{ end_date: null }, { end_date: { gte: periodStart } }],
      },
      include: {
        salary_structures: true,
        departments: true,
        job_positions: true,
        working_schedules: true,
      },
      orderBy: { start_date: 'desc' },
    });
  }

  static async create(data: Prisma.contractsUncheckedCreateInput) {
    return prisma.contracts.create({
      data,
      include: {
        employees: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
          },
        },
        salary_structures: {
          select: {
            id: true,
            name: true,
          },
        },
        departments: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        job_positions: {
          select: {
            id: true,
            title: true,
          },
        },
        working_schedules: {
          select: {
            id: true,
            name: true,
            weekly_hours: true,
          },
        },
      },
    });
  }

  static async update(id: bigint, data: Prisma.contractsUncheckedUpdateInput) {
    return prisma.contracts.update({
      where: { id },
      data,
      include: {
        employees: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
          },
        },
        salary_structures: {
          select: {
            id: true,
            name: true,
          },
        },
        departments: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        job_positions: {
          select: {
            id: true,
            title: true,
          },
        },
        working_schedules: {
          select: {
            id: true,
            name: true,
            weekly_hours: true,
          },
        },
      },
    });
  }

  static async delete(id: bigint) {
    return prisma.contracts.delete({
      where: { id },
    });
  }
}
