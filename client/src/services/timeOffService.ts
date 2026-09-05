import { mockDB } from './mockDatabase';
import { businessLogic } from './businessLogicEngine';
import type {
  LeaveType,
  CreateLeaveTypeDTO,
  LeaveAllocation,
  CreateAllocationDTO,
  LeaveRequest,
  CreateLeaveRequestDTO,
  LeaveRequestStatus,
  AllocationStatus,
} from '../types';

export const timeOffService = {
  // ==========================================
  // Leave Types
  // ==========================================
  listLeaveTypes: async (params?: { search?: string; isActive?: string }): Promise<LeaveType[]> => {
    const state = mockDB.getState();
    let result = state.leaveTypes;
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q));
    }
    if (params?.isActive !== undefined && params.isActive !== 'all') {
      const active = params.isActive === 'true';
      result = result.filter(t => t.isActive === active);
    }
    return result;
  },

  createLeaveType: async (data: CreateLeaveTypeDTO): Promise<LeaveType> => {
    const newType: LeaveType = {
      id: `lt-${Date.now()}`,
      name: data.name,
      code: (data.code || `LT_${Date.now().toString().slice(-4)}`).toUpperCase(),
      unit: data.unit || 'DAY',
      requiresAllocation: data.requiresAllocation !== undefined ? data.requiresAllocation : true,
      requiresApproval: data.requiresApproval !== undefined ? data.requiresApproval : true,
      payrollDeductible: data.payrollDeductible || false,
      maxConsecutiveUnits: data.maxConsecutiveUnits ? Number(data.maxConsecutiveUnits) : undefined,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    mockDB.updateState(draft => {
      draft.leaveTypes.push(newType);
    });

    return newType;
  },

  updateLeaveType: async (id: string, data: Partial<CreateLeaveTypeDTO>): Promise<LeaveType> => {
    let updated: LeaveType | null = null;
    mockDB.updateState(draft => {
      const t = draft.leaveTypes.find(item => item.id === id);
      if (t) {
        Object.assign(t, data);
        updated = t;
      }
    });
    if (!updated) throw new Error('Leave type not found');
    return updated;
  },

  deleteLeaveType: async (id: string): Promise<void> => {
    mockDB.updateState(draft => {
      draft.leaveTypes = draft.leaveTypes.filter(t => t.id !== id);
    });
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
    const state = mockDB.getState();
    let result = state.leaveAllocations.map(a => ({
      ...a,
      employee: state.employees.find(e => e.id === a.employeeId),
      leaveType: state.leaveTypes.find(t => t.id === a.leaveTypeId),
    }));

    if (params?.employeeId && params.employeeId !== 'all') {
      result = result.filter(a => a.employeeId === params.employeeId);
    }
    if (params?.leaveTypeId && params.leaveTypeId !== 'all') {
      result = result.filter(a => a.leaveTypeId === params.leaveTypeId);
    }
    if (params?.status) {
      result = result.filter(a => a.status === params.status);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const total = result.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;

    return {
      data: result.slice(startIndex, startIndex + limit),
      meta: { page, limit, total, totalPages },
    };
  },

  createAllocation: async (data: CreateAllocationDTO): Promise<LeaveAllocation> => {
    const allocated = Number(data.allocatedUnits || 0);
    const newAlloc: LeaveAllocation = {
      id: `alloc-${Date.now()}`,
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      validFrom: data.validFrom,
      validTo: data.validTo,
      allocatedUnits: allocated,
      usedUnits: 0,
      remainingUnits: allocated,
      status: data.status || 'APPROVED',
    };

    mockDB.updateState(draft => {
      draft.leaveAllocations.unshift(newAlloc);
    });

    return newAlloc;
  },

  updateAllocation: async (
    id: string,
    data: { validFrom?: string; validTo?: string; allocatedUnits?: number; status?: AllocationStatus }
  ): Promise<LeaveAllocation> => {
    let updated: LeaveAllocation | null = null;
    mockDB.updateState(draft => {
      const a = draft.leaveAllocations.find(item => item.id === id);
      if (a) {
        if (data.validFrom) a.validFrom = data.validFrom;
        if (data.validTo) a.validTo = data.validTo;
        if (data.status) a.status = data.status;
        if (data.allocatedUnits !== undefined) {
          a.allocatedUnits = Number(data.allocatedUnits);
          a.remainingUnits = Math.max(0, a.allocatedUnits - (a.usedUnits || 0));
        }
        updated = a;
      }
    });
    if (!updated) throw new Error('Allocation not found');
    return updated;
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
    const state = mockDB.getState();
    let result = state.leaveRequests.map(r => ({
      ...r,
      employee: state.employees.find(e => e.id === r.employeeId),
      leaveType: state.leaveTypes.find(t => t.id === r.leaveTypeId),
    }));

    if (params?.employeeId && params.employeeId !== 'all') {
      result = result.filter(r => r.employeeId === params.employeeId);
    }
    if (params?.status) {
      result = result.filter(r => r.status === params.status);
    }
    if (params?.startDate) {
      result = result.filter(r => r.startDate >= params.startDate!);
    }
    if (params?.endDate) {
      result = result.filter(r => r.endDate <= params.endDate!);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const total = result.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;

    return {
      data: result.slice(startIndex, startIndex + limit),
      meta: { page, limit, total, totalPages },
    };
  },

  createLeaveRequest: async (data: CreateLeaveRequestDTO): Promise<LeaveRequest> => {
    const empId = data.employeeId || 'emp-1';
    const val = businessLogic.validateLeaveRequest(
      empId,
      data.leaveTypeId,
      data.startDate,
      data.endDate
    );

    if (!val.isValid) {
      throw new Error(val.errorMessage || 'Invalid leave request');
    }

    const requestedUnits = val.requestedDays;
    const newReq: LeaveRequest = {
      id: `lr-${Date.now()}`,
      employeeId: empId,
      leaveTypeId: data.leaveTypeId,
      startDate: data.startDate,
      endDate: data.endDate,
      requestedUnits,
      reason: data.reason || '',
      status: 'PENDING',
    };

    mockDB.updateState(draft => {
      draft.leaveRequests.unshift(newReq);
    });

    return newReq;
  },

  approveLeaveRequest: async (id: string): Promise<void> => {
    const res = businessLogic.approveLeaveRequest(id);
    if (!res.success) {
      throw new Error(res.error || 'Failed to approve leave request');
    }
  },

  rejectLeaveRequest: async (id: string): Promise<void> => {
    const res = businessLogic.rejectLeaveRequest(id);
    if (!res.success) {
      throw new Error(res.error || 'Failed to reject leave request');
    }
  },

  cancelLeaveRequest: async (id: string): Promise<void> => {
    mockDB.updateState(draft => {
      const r = draft.leaveRequests.find(item => item.id === id);
      if (r) {
        r.status = 'CANCELLED';
      }
    });
  },
};
