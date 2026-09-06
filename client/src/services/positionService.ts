import { api } from './api';
import type {
  JobPosition,
  CreateJobPositionDTO,
  UpdateJobPositionDTO,
  JobPositionFilterParams,
  ApiResponse,
} from '../types';

export const PositionService = {
  /**
   * Fetch paginated list of job positions with search & status filters
   */
  async listPositions(params?: JobPositionFilterParams): Promise<ApiResponse<JobPosition[]>> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.isActive !== undefined && params.isActive !== 'all') {
      query.append('isActive', params.isActive);
    }
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    const endpoint = `/job-positions${queryString ? `?${queryString}` : ''}`;
    return api.get<ApiResponse<JobPosition[]>>(endpoint);
  },

  /**
   * Get single job position details by ID
   */
  async getPositionById(id: string): Promise<ApiResponse<JobPosition>> {
    return api.get<ApiResponse<JobPosition>>(`/job-positions/${id}`);
  },

  /**
   * Create a new job position
   */
  async createPosition(data: CreateJobPositionDTO): Promise<ApiResponse<JobPosition>> {
    return api.post<ApiResponse<JobPosition>>('/job-positions', {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      isActive: data.isActive ?? true,
    });
  },

  /**
   * Update job position details
   */
  async updatePosition(id: string, data: UpdateJobPositionDTO): Promise<ApiResponse<JobPosition>> {
    const payload: UpdateJobPositionDTO = {};
    if (data.title !== undefined) payload.title = data.title.trim();
    if (data.description !== undefined) payload.description = data.description ? data.description.trim() : '';
    if (data.isActive !== undefined) payload.isActive = data.isActive;

    return api.patch<ApiResponse<JobPosition>>(`/job-positions/${id}`, payload);
  },

  /**
   * Toggle job position active status
   */
  async togglePositionStatus(id: string, currentStatus: boolean): Promise<ApiResponse<JobPosition>> {
    return this.updatePosition(id, { isActive: !currentStatus });
  },

  /**
   * Delete or archive job position
   */
  async deletePosition(id: string): Promise<ApiResponse<{ id: string; action: 'DEACTIVATED' | 'DELETED'; message: string }>> {
    return api.delete<ApiResponse<{ id: string; action: 'DEACTIVATED' | 'DELETED'; message: string }>>(`/job-positions/${id}`);
  },
};
