import { mockDB } from './mockDatabase';
import type {
  Department,
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
  DepartmentFilterParams,
  PaginationMeta,
} from '../types';

export const departmentService = {
  createDepartment: async (data: CreateDepartmentDTO): Promise<any> => {
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name: data.name,
      code: data.code.toUpperCase(),
      isActive: data.isActive !== undefined ? data.isActive : true,
      employeeCount: 0,
      contractCount: 0,
    };
    mockDB.updateState(draft => {
      draft.departments.push(newDept);
    });
    return { success: true, data: newDept };
  },

  listDepartments: async (
    params: DepartmentFilterParams = {}
  ): Promise<any> => {
    const state = mockDB.getState();
    let result = state.departments.map(d => ({
      ...d,
      employeeCount: state.employees.filter(e => e.departmentId === d.id).length,
      contractCount: state.contracts.filter(c => c.departmentId === d.id).length,
    }));

    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(d => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q));
    }
    if (params.isActive !== undefined && params.isActive !== 'all') {
      const active = params.isActive === 'true';
      result = result.filter(d => d.isActive === active);
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

  getDepartmentById: async (id: string): Promise<any> => {
    const state = mockDB.getState();
    const d = state.departments.find(item => item.id === id);
    if (!d) throw new Error('Department not found');
    return { success: true, data: d };
  },

  updateDepartment: async (id: string, data: UpdateDepartmentDTO): Promise<any> => {
    let updated: Department | null = null;
    mockDB.updateState(draft => {
      const d = draft.departments.find(item => item.id === id);
      if (d) {
        Object.assign(d, data);
        if (data.code) d.code = data.code.toUpperCase();
        updated = d;
      }
    });
    if (!updated) throw new Error('Department not found');
    return { success: true, data: updated };
  },

  toggleDepartmentStatus: async (id: string, isActive?: boolean): Promise<any> => {
    let updated: Department | null = null;
    mockDB.updateState(draft => {
      const d = draft.departments.find(item => item.id === id);
      if (d) {
        d.isActive = isActive !== undefined ? isActive : !d.isActive;
        updated = d;
      }
    });
    if (!updated) throw new Error('Department not found');
    return { success: true, data: updated };
  },

  deleteDepartment: async (id: string): Promise<any> => {
    mockDB.updateState(draft => {
      draft.departments = draft.departments.filter(d => d.id !== id);
    });
    return { success: true, data: null };
  },
};

export const DepartmentService = departmentService;
