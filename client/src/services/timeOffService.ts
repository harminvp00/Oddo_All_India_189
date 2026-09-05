import { api } from './api';
import type {
  LeaveType,
  CreateLeaveTypeDTO,
  LeaveAllocation,
  CreateAllocationDTO,
  LeaveRequest,
  CreateLeaveRequestDTO,
  LeaveRequestStatus,
  AllocationStatus,
  ApiResponse,
} from '../types';

export const timeOffService = {
  // ==========================================
  // Leave Types
  // ==========================================
  listLeaveTypes: async (params?: { search?: string; isActive?: string }): Promise<LeaveType[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.isActive !== undefined && params.isActive !== 'all') {
      query.append('isActive', params.isActive);
    }
    const endpoint = `/leave-types${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await api.get<ApiResponse<LeaveType[]>>(endpoint);
    return res.data || [];
  },

  createLeaveType: async (data: CreateLeaveTypeDTO): Promise<LeaveType> => {
    const res = await api.post<ApiResponse<LeaveType>>('/leave-types', data);
    return res.data;
  },

  updateLeaveType: async (id: string, data: Partial<CreateLeaveTypeDTO>): Promise<LeaveType> => {
    const res = await api.patch<ApiResponse<LeaveType>>(`/leave-types/${id}`, data);
    return res.data;
  },

  deleteLeaveType: async (id: string): Promise<void> => {
    await api.delete(`/leave-types/${id}`);
  },

  // ==========================================
  // Leave Allocations
  // ==========================================
  listAllocations: async (params?: {
    employeeId?: string;
    leaveTypeId?: string;
    status?: AllocationStatus;
    page?: number;
    limit?: number;
  }): Promise<{ data: LeaveAllocation[]; meta: any }> => {
    const query = new URLSearchParams();
    if (params?.employeeId && params.employeeId !== 'all') query.append('employeeId', params.employeeId);
    if (params?.leaveTypeId && params.leaveTypeId !== 'all') query.append('leaveTypeId', params.leaveTypeId);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const endpoint = `/leave-allocations${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await api.get<any>(endpoint);
    return {
      data: res.data?.data || res.data || [],
      meta: res.data?.meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  createAllocation: async (data: CreateAllocationDTO): Promise<LeaveAllocation> => {
    const res = await api.post<ApiResponse<LeaveAllocation>>('/leave-allocations', data);
    return res.data;
  },

  updateAllocation: async (
    id: string,
    data: { validFrom?: string; validTo?: string; allocatedUnits?: number; status?: AllocationStatus }
  ): Promise<LeaveAllocation> => {
    const res = await api.patch<ApiResponse<LeaveAllocation>>(`/leave-allocations/${id}`, data);
    return res.data;
  },

  // ==========================================
  // Leave Requests
  // ==========================================
  listLeaveRequests: async (params?: {
    employeeId?: string;
    status?: LeaveRequestStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: LeaveRequest[]; meta: any }> => {
    const query = new URLSearchParams();
    if (params?.employeeId && params.employeeId !== 'all') query.append('employeeId', params.employeeId);
    if (params?.status) query.append('status', params.status);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const endpoint = `/leave-requests${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await api.get<any>(endpoint);
    return {
      data: res.data?.data || res.data || [],
      meta: res.data?.meta || { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  },

  createLeaveRequest: async (data: CreateLeaveRequestDTO): Promise<LeaveRequest> => {
    const res = await api.post<ApiResponse<LeaveRequest>>('/leave-requests', data);
    return res.data;
  },

  approveLeaveRequest: async (id: string): Promise<LeaveRequest> => {
    const res = await api.post<ApiResponse<LeaveRequest>>(`/leave-requests/${id}/approve`);
    return res.data;
  },

  rejectLeaveRequest: async (id: string): Promise<LeaveRequest> => {
    const res = await api.post<ApiResponse<LeaveRequest>>(`/leave-requests/${id}/reject`);
    return res.data;
  },

  cancelLeaveRequest: async (id: string): Promise<LeaveRequest> => {
    const res = await api.post<ApiResponse<LeaveRequest>>(`/leave-requests/${id}/cancel`);
    return res.data;
  },
};
