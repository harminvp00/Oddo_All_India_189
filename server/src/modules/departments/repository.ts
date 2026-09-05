import prisma from '../../config/database';

export interface DepartmentFilterQuery {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export class DepartmentRepository {
  static async findMany(filters: DepartmentFilterQuery) {
    const { search, isActive, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.departments.count({ where }),
      prisma.departments.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              employees: true,
              contracts: true,
            },
          },
        },
      }),
    ]);

    return { total, items };
  }

  static async findById(id: bigint) {
    return prisma.departments.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
            contracts: true,
          },
        },
      },
    });
  }

  static async findByNameOrCode(name?: string, code?: string, excludeId?: bigint) {
    const conditions: any[] = [];
    if (name) {
      conditions.push({ name: { equals: name, mode: 'insensitive' as const } });
    }
    if (code) {
      conditions.push({ code: { equals: code, mode: 'insensitive' as const } });
    }

    if (conditions.length === 0) return null;

    return prisma.departments.findFirst({
      where: {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: conditions,
      },
    });
  }

  static async create(data: { name: string; code: string; is_active: boolean }) {
    return prisma.departments.create({
      data,
    });
  }

  static async update(id: bigint, data: { name?: string; code?: string; is_active?: boolean }) {
    return prisma.departments.update({
      where: { id },
      data,
    });
  }

  static async delete(id: bigint) {
    return prisma.departments.delete({
      where: { id },
    });
  }
}
