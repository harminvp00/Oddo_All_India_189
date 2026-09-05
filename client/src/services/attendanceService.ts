import { api } from './api';
import type {
  AttendanceRecord,
  CheckInDTO,
  CheckOutDTO,
  CorrectionDTO,
  AttendanceFilterParams,
  PaginationMeta,
  ApiResponse,
} from '../types';

export const attendanceService = {
  checkIn: async (data: CheckInDTO = {}): Promise<AttendanceRecord> => {
    const res = await api.post<ApiResponse<AttendanceRecord>>('/attendance/check-in', data);
    return res.data;
  },

  checkOut: async (data: CheckOutDTO = {}): Promise<AttendanceRecord> => {
    const res = await api.post<ApiResponse<AttendanceRecord>>('/attendance/check-out', data);
    return res.data;
  },

  getAttendanceList: async (
    params: AttendanceFilterParams = {}
  ): Promise<{ items: AttendanceRecord[]; meta: PaginationMeta }> => {
    const query = new URLSearchParams();
    if (params.employeeId) query.append('employeeId', params.employeeId);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const endpoint = `/attendance${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await api.get<ApiResponse<AttendanceRecord[]>>(endpoint);

    return {
      items: res.data || [],
      meta: res.meta || {
        page: params.page || 1,
        limit: params.limit || 20,
        total: res.data?.length || 0,
        totalPages: 1,
      },
    };
  },

  getAttendanceById: async (id: string): Promise<AttendanceRecord> => {
    const res = await api.get<ApiResponse<AttendanceRecord>>(`/attendance/${id}`);
    return res.data;
  },

  correctAttendance: async (id: string, data: CorrectionDTO): Promise<AttendanceRecord> => {
    const res = await api.patch<ApiResponse<AttendanceRecord>>(`/attendance/${id}`, data);
    return res.data;
  },
};
