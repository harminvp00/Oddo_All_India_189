import { JobPositionRepository } from './repository';
import {
  CreateJobPositionInput,
  UpdateJobPositionInput,
  JobPositionFilterInput,
} from './validation';

export class JobPositionService {
  static async listPositions(filters: JobPositionFilterInput) {
    const { page = 1, limit = 20 } = filters;
    const { total, items } = await JobPositionRepository.findMany(filters);

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
    const position = await JobPositionRepository.findById(id);

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
    const existing = await JobPositionRepository.findByTitle(input.title);

    if (existing) {
      const error = new Error('Job position with this title already exists');
      (error as any).code = 'DUPLICATE_RESOURCE';
      throw error;
    }

    const position = await JobPositionRepository.create({
      title: input.title,
      description: input.description ?? null,
      is_active: input.isActive ?? true,
    });

    return {
      id: position.id.toString(),
      title: position.title,
      description: position.description,
      isActive: position.is_active,
    };
  }

  static async updatePosition(id: bigint, input: UpdateJobPositionInput) {
    const existing = await JobPositionRepository.findById(id);

    if (!existing) {
      const error = new Error('Job position not found');
      (error as any).code = 'NOT_FOUND';
      throw error;
    }

    if (input.title) {
      const conflict = await JobPositionRepository.findByTitle(input.title, id);

      if (conflict) {
        const error = new Error('Another job position with this title already exists');
        (error as any).code = 'DUPLICATE_RESOURCE';
        throw error;
      }
    }

    const updated = await JobPositionRepository.update(id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
    });

    return {
      id: updated.id.toString(),
      title: updated.title,
      description: updated.description,
      isActive: updated.is_active,
    };
  }

  static async deletePosition(id: bigint) {
    const existing = await JobPositionRepository.findById(id);

    if (!existing) {
      const error = new Error('Job position not found');
      (error as any).code = 'NOT_FOUND';
      throw error;
    }

    const hasRelations = existing._count.employees > 0 || existing._count.contracts > 0;

    if (hasRelations) {
      const deactivated = await JobPositionRepository.update(id, {
        is_active: false,
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

    await JobPositionRepository.delete(id);

    return {
      id: id.toString(),
      action: 'DELETED',
      message: 'Job position deleted successfully.',
    };
  }
}
