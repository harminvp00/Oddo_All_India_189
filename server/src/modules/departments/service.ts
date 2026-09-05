import { DepartmentRepository } from './repository';
import { CreateDepartmentInput, UpdateDepartmentInput, DepartmentFilterInput } from './validation';

export class DepartmentService {
  static async listDepartments(filters: DepartmentFilterInput) {
    const { page = 1, limit = 20 } = filters;
    const { total, items } = await DepartmentRepository.findMany(filters);

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
    const department = await DepartmentRepository.findById(id);

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
    const existing = await DepartmentRepository.findByNameOrCode(input.name, input.code);

    if (existing) {
      const field = existing.code.toUpperCase() === input.code.toUpperCase() ? 'code' : 'name';
      const error = new Error(`Department with this ${field} already exists`);
      (error as any).code = 'DUPLICATE_RESOURCE';
      throw error;
    }

    const department = await DepartmentRepository.create({
      name: input.name,
      code: input.code,
      is_active: input.isActive ?? true,
    });

    return {
      id: department.id.toString(),
      name: department.name,
      code: department.code,
      isActive: department.is_active,
    };
  }

  static async updateDepartment(id: bigint, input: UpdateDepartmentInput) {
    const existing = await DepartmentRepository.findById(id);

    if (!existing) {
      const error = new Error('Department not found');
      (error as any).code = 'NOT_FOUND';
      throw error;
    }

    if (input.name || input.code) {
      const conflict = await DepartmentRepository.findByNameOrCode(input.name, input.code, id);

      if (conflict) {
        const field = input.code && conflict.code === input.code ? 'code' : 'name';
        const error = new Error(`Another department with this ${field} already exists`);
        (error as any).code = 'DUPLICATE_RESOURCE';
        throw error;
      }
    }

    const updated = await DepartmentRepository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.code !== undefined ? { code: input.code } : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
    });

    return {
      id: updated.id.toString(),
      name: updated.name,
      code: updated.code,
      isActive: updated.is_active,
    };
  }

  static async deleteDepartment(id: bigint) {
    const existing = await DepartmentRepository.findById(id);

    if (!existing) {
      const error = new Error('Department not found');
      (error as any).code = 'NOT_FOUND';
      throw error;
    }

    const hasRelations = existing._count.employees > 0 || existing._count.contracts > 0;

    if (hasRelations) {
      const deactivated = await DepartmentRepository.update(id, {
        is_active: false,
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

    await DepartmentRepository.delete(id);

    return {
      id: id.toString(),
      action: 'DELETED',
      message: 'Department deleted successfully.',
    };
  }
}
