import { api } from './api';
import type {
  Department,
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
  DepartmentFilterParams,
  ApiResponse,
} from '../types';

export const DepartmentService = {
  /**
   * Fetch paginated list of departments with optional search and active filter
   */
  async listDepartments(params?: DepartmentFilterParams): Promise<ApiResponse<Department[]>> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.isActive !== undefined && params.isActive !== 'all') {
      query.append('isActive', params.isActive);
    }
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    const endpoint = `/departments${queryString ? `?${queryString}` : ''}`;
    return api.get<ApiResponse<Department[]>>(endpoint);
  },

  /**
   * Get single department details by ID
   */
  async getDepartmentById(id: string): Promise<ApiResponse<Department>> {
    return api.get<ApiResponse<Department>>(`/departments/${id}`);
  },

  /**
   * Create a new department
   */
  async createDepartment(data: CreateDepartmentDTO): Promise<ApiResponse<Department>> {
    return api.post<ApiResponse<Department>>('/departments', {
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      isActive: data.isActive ?? true,
    });
  },

  /**
   * Update department details
   */
  async updateDepartment(id: string, data: UpdateDepartmentDTO): Promise<ApiResponse<Department>> {
    const payload: UpdateDepartmentDTO = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.code !== undefined) payload.code = data.code.trim().toUpperCase();
    if (data.isActive !== undefined) payload.isActive = data.isActive;

    return api.patch<ApiResponse<Department>>(`/departments/${id}`, payload);
  },

  /**
   * Toggle department active status
   */
  async toggleDepartmentStatus(id: string, currentStatus: boolean): Promise<ApiResponse<Department>> {
    return this.updateDepartment(id, { isActive: !currentStatus });
  },

  /**
   * Delete or archive department
   */
  async deleteDepartment(id: string): Promise<ApiResponse<{ id: string; action: 'DEACTIVATED' | 'DELETED'; message: string }>> {
    return api.delete<ApiResponse<{ id: string; action: 'DEACTIVATED' | 'DELETED'; message: string }>>(`/departments/${id}`);
  },
};
