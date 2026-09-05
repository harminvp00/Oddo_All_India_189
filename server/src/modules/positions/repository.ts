import prisma from '../../config/database';

export interface JobPositionFilterQuery {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export class JobPositionRepository {
  static async findMany(filters: JobPositionFilterQuery) {
    const { search, isActive, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.job_positions.count({ where }),
      prisma.job_positions.findMany({
        where,
        skip,
        take: limit,
        orderBy: { title: 'asc' },
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
    return prisma.job_positions.findUnique({
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

  static async findByTitle(title: string, excludeId?: bigint) {
    return prisma.job_positions.findFirst({
      where: {
        ...(excludeId ? { id: { not: excludeId } } : {}),
        title: { equals: title, mode: 'insensitive' as const },
      },
    });
  }

  static async create(data: { title: string; description?: string | null; is_active: boolean }) {
    return prisma.job_positions.create({
      data,
    });
  }

  static async update(
    id: bigint,
    data: { title?: string; description?: string | null; is_active?: boolean }
  ) {
    return prisma.job_positions.update({
      where: { id },
      data,
    });
  }

  static async delete(id: bigint) {
    return prisma.job_positions.delete({
      where: { id },
    });
  }
}
