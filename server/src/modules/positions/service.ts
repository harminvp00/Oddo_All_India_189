import prisma from '../../config/database';
import {
  CreateJobPositionInput,
  UpdateJobPositionInput,
  JobPositionFilterInput,
} from './validation';

export class JobPositionService {
  static async listPositions(filters: JobPositionFilterInput) {
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

    const formatted = items.map((pos: any) => ({
      id: pos.id.toString(),
      title: pos.title,
      description: pos.description,
      isActive: pos.is_active,
      employeeCount: pos._count.employees,
      contractCount: pos._count.contracts,
    }));

    return {
      items: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getPositionById(id: bigint) {
    const position = await prisma.job_positions.findUnique({
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

    if (!position) {
      return null;
    }

    return {
      id: position.id.toString(),
      title: position.title,
      description: position.description,
      isActive: position.is_active,
      employeeCount: position._count.employees,
      contractCount: position._count.contracts,
    };
  }

  static async createPosition(input: CreateJobPositionInput) {
    const existing = await prisma.job_positions.findFirst({
      where: {
        title: { equals: input.title, mode: 'insensitive' as const },
      },
    });

    if (existing) {
      const error = new Error('Job position with this title already exists');
      (error as any).code = 'DUPLICATE_RESOURCE';
      throw error;
    }

    const position = await prisma.job_positions.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        is_active: input.isActive ?? true,
      },
    });

    return {
      id: position.id.toString(),
      title: position.title,
      description: position.description,
      isActive: position.is_active,
    };
  }

  static async updatePosition(id: bigint, input: UpdateJobPositionInput) {
    const existing = await prisma.job_positions.findUnique({
      where: { id },
    });

    if (!existing) {
      const error = new Error('Job position not found');
      (error as any).code = 'NOT_FOUND';
      throw error;
    }

    if (input.title) {
      const conflict = await prisma.job_positions.findFirst({
        where: {
          id: { not: id },
          title: { equals: input.title, mode: 'insensitive' as const },
        },
      });

      if (conflict) {
        const error = new Error('Another job position with this title already exists');
        (error as any).code = 'DUPLICATE_RESOURCE';
        throw error;
      }
    }

    const updated = await prisma.job_positions.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
      },
    });

    return {
      id: updated.id.toString(),
      title: updated.title,
      description: updated.description,
      isActive: updated.is_active,
    };
  }

  static async deletePosition(id: bigint) {
    const existing = await prisma.job_positions.findUnique({
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

    if (!existing) {
      const error = new Error('Job position not found');
      (error as any).code = 'NOT_FOUND';
      throw error;
    }

    const hasRelations = existing._count.employees > 0 || existing._count.contracts > 0;

    if (hasRelations) {
      const deactivated = await prisma.job_positions.update({
        where: { id },
        data: { is_active: false },
      });

      return {
        id: deactivated.id.toString(),
        title: deactivated.title,
        description: deactivated.description,
        isActive: false,
        action: 'DEACTIVATED',
        message: 'Job position has linked employees or contracts and was deactivated instead of deleted.',
      };
    }

    await prisma.job_positions.delete({
      where: { id },
    });

    return {
      id: id.toString(),
      action: 'DELETED',
      message: 'Job position deleted successfully.',
    };
  }
}
