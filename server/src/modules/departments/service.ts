import prisma from '../../config/database';
import { CreateDepartmentInput, UpdateDepartmentInput, DepartmentFilterInput } from './validation';

export class DepartmentService {
  static async listDepartments(filters: DepartmentFilterInput) {
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

    const formatted = items.map((dept: any) => ({
      id: dept.id.toString(),
      name: dept.name,
      code: dept.code,
      isActive: dept.is_active,
      employeeCount: dept._count.employees,
      contractCount: dept._count.contracts,
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

  static async getDepartmentById(id: bigint) {
    const department = await prisma.departments.findUnique({
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

    if (!department) {
      return null;
    }

    return {
      id: department.id.toString(),
      name: department.name,
      code: department.code,
      isActive: department.is_active,
      employeeCount: department._count.employees,
      contractCount: department._count.contracts,
    };
  }

  static async createDepartment(input: CreateDepartmentInput) {
    const existing = await prisma.departments.findFirst({
      where: {
        OR: [
          { name: { equals: input.name, mode: 'insensitive' as const } },
          { code: input.code },
        ],
      },
    });

    if (existing) {
      const field = existing.code.toUpperCase() === input.code.toUpperCase() ? 'code' : 'name';
      const error = new Error(`Department with this ${field} already exists`);
      (error as any).code = 'DUPLICATE_RESOURCE';
      throw error;
    }

    const department = await prisma.departments.create({
      data: {
        name: input.name,
        code: input.code,
        is_active: input.isActive ?? true,
      },
    });

    return {
      id: department.id.toString(),
      name: department.name,
      code: department.code,
      isActive: department.is_active,
    };
  }

  static async updateDepartment(id: bigint, input: UpdateDepartmentInput) {
    const existing = await prisma.departments.findUnique({
      where: { id },
    });

    if (!existing) {
      const error = new Error('Department not found');
      (error as any).code = 'NOT_FOUND';
      throw error;
    }

    if (input.name || input.code) {
      const conflictConditions: any[] = [];
      if (input.name) {
        conflictConditions.push({ name: { equals: input.name, mode: 'insensitive' as const } });
      }
      if (input.code) {
        conflictConditions.push({ code: input.code });
      }

      const conflict = await prisma.departments.findFirst({
        where: {
          id: { not: id },
          OR: conflictConditions,
        },
      });

      if (conflict) {
        const field = input.code && conflict.code === input.code ? 'code' : 'name';
        const error = new Error(`Another department with this ${field} already exists`);
        (error as any).code = 'DUPLICATE_RESOURCE';
        throw error;
      }
    }

    const updated = await prisma.departments.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
      },
    });

    return {
      id: updated.id.toString(),
      name: updated.name,
      code: updated.code,
      isActive: updated.is_active,
    };
  }

  static async deleteDepartment(id: bigint) {
    const existing = await prisma.departments.findUnique({
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
      const error = new Error('Department not found');
      (error as any).code = 'NOT_FOUND';
      throw error;
    }

    const hasRelations = existing._count.employees > 0 || existing._count.contracts > 0;

    if (hasRelations) {
      const deactivated = await prisma.departments.update({
        where: { id },
        data: { is_active: false },
      });

      return {
        id: deactivated.id.toString(),
        name: deactivated.name,
        code: deactivated.code,
        isActive: false,
        action: 'DEACTIVATED',
        message: 'Department has linked employees or contracts and was deactivated instead of deleted.',
      };
    }

    await prisma.departments.delete({
      where: { id },
    });

    return {
      id: id.toString(),
      action: 'DELETED',
      message: 'Department deleted successfully.',
    };
  }
}
