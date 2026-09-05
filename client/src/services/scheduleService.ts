import { api } from './api';
import type {
  WorkingSchedule,
  CreateWorkingScheduleDTO,
  UpdateWorkingScheduleDTO,
  WorkingScheduleFilterParams,
  ApiResponse,
} from '../types';

export const ScheduleService = {
  /**
   * Fetch paginated list of working schedules with search and status filters
   */
  async listSchedules(params?: WorkingScheduleFilterParams): Promise<ApiResponse<WorkingSchedule[]>> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.isActive !== undefined && params.isActive !== 'all') {
      query.append('isActive', params.isActive);
    }
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString();
    const endpoint = `/working-schedules${queryString ? `?${queryString}` : ''}`;
    return api.get<ApiResponse<WorkingSchedule[]>>(endpoint);
  },

  /**
   * Get single working schedule details by ID (including schedule days)
   */
  async getScheduleById(id: string): Promise<ApiResponse<WorkingSchedule>> {
    return api.get<ApiResponse<WorkingSchedule>>(`/working-schedules/${id}`);
  },

  /**
   * Create a new working schedule
   */
  async createSchedule(data: CreateWorkingScheduleDTO): Promise<ApiResponse<WorkingSchedule>> {
    return api.post<ApiResponse<WorkingSchedule>>('/working-schedules', {
      name: data.name.trim(),
      scheduleType: data.scheduleType ?? 'FIXED',
      isActive: data.isActive ?? true,
      scheduleDays: data.scheduleDays.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime || null,
        endTime: d.endTime || null,
        breakMinutes: d.breakMinutes || 0,
      })),
    });
  },

  /**
   * Update working schedule details
   */
  async updateSchedule(id: string, data: UpdateWorkingScheduleDTO): Promise<ApiResponse<WorkingSchedule>> {
    const payload: UpdateWorkingScheduleDTO = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.scheduleType !== undefined) payload.scheduleType = data.scheduleType;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.scheduleDays !== undefined) {
      payload.scheduleDays = data.scheduleDays.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime || null,
        endTime: d.endTime || null,
        breakMinutes: d.breakMinutes || 0,
      }));
    }

    return api.patch<ApiResponse<WorkingSchedule>>(`/working-schedules/${id}`, payload);
  },

  /**
   * Toggle working schedule active status
   */
  async toggleScheduleStatus(id: string, currentStatus: boolean): Promise<ApiResponse<WorkingSchedule>> {
    return this.updateSchedule(id, { isActive: !currentStatus });
  },

  /**
   * Delete or archive working schedule
   */
  async deleteSchedule(id: string): Promise<ApiResponse<{ id: string; action: 'DEACTIVATED' | 'DELETED'; message: string }>> {
    return api.delete<ApiResponse<{ id: string; action: 'DEACTIVATED' | 'DELETED'; message: string }>>(`/working-schedules/${id}`);
  },
};
