import { mockDB } from './mockDatabase';
import type {
  JobPosition,
  CreateJobPositionDTO,
  UpdateJobPositionDTO,
  JobPositionFilterParams,
  PaginationMeta,
} from '../types';

export const positionService = {
  createPosition: async (data: CreateJobPositionDTO): Promise<any> => {
    const newPos: JobPosition = {
      id: `pos-${Date.now()}`,
      title: data.title,
      description: data.description || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      employeeCount: 0,
      contractCount: 0,
    };
    mockDB.updateState(draft => {
      draft.jobPositions.push(newPos);
    });
    return { success: true, data: newPos };
  },

  listPositions: async (
    params: JobPositionFilterParams = {}
  ): Promise<any> => {
    const state = mockDB.getState();
    let result = state.jobPositions.map(p => ({
      ...p,
      employeeCount: state.employees.filter(e => e.positionId === p.id).length,
      contractCount: state.contracts.filter(c => c.positionId === p.id).length,
    }));

    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(q));
    }
    if (params.isActive !== undefined && params.isActive !== 'all') {
      const active = params.isActive === 'true';
      result = result.filter(p => p.isActive === active);
    }

    const page = params.page || 1;
    const limit = params.limit || 50;
    const total = result.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: paginated,
      items: paginated,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },

  getPositionById: async (id: string): Promise<any> => {
    const state = mockDB.getState();
    const p = state.jobPositions.find(item => item.id === id);
    if (!p) throw new Error('Position not found');
    return { success: true, data: p };
  },

  updatePosition: async (id: string, data: UpdateJobPositionDTO): Promise<any> => {
    let updated: JobPosition | null = null;
    mockDB.updateState(draft => {
      const p = draft.jobPositions.find(item => item.id === id);
      if (p) {
        Object.assign(p, data);
        updated = p;
      }
    });
    if (!updated) throw new Error('Position not found');
    return { success: true, data: updated };
  },

  togglePositionStatus: async (id: string, isActive?: boolean): Promise<any> => {
    let updated: JobPosition | null = null;
    mockDB.updateState(draft => {
      const p = draft.jobPositions.find(item => item.id === id);
      if (p) {
        p.isActive = isActive !== undefined ? isActive : !p.isActive;
        updated = p;
      }
    });
    if (!updated) throw new Error('Position not found');
    return { success: true, data: updated };
  },

  deletePosition: async (id: string): Promise<any> => {
    mockDB.updateState(draft => {
      draft.jobPositions = draft.jobPositions.filter(p => p.id !== id);
    });
    return { success: true, data: null };
  },
};

export const PositionService = positionService;
