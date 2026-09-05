import { mockDB } from './mockDatabase';
import { businessLogic } from './businessLogicEngine';
import type {
  AttendanceRecord,
  CheckInDTO,
  CheckOutDTO,
  CorrectionDTO,
  AttendanceFilterParams,
  PaginationMeta,
} from '../types';

export const attendanceService = {
  checkIn: async (data: CheckInDTO = {}): Promise<AttendanceRecord> => {
    const state = mockDB.getState();
    const empId = data.employeeId || 'emp-1';
    const today = data.attendanceDate || new Date().toISOString().split('T')[0];
    const nowIso = data.checkIn || new Date().toISOString();

    const existing = state.attendances.find(
      a => a.employeeId === empId && a.attendanceDate === today
    );

    if (existing) {
      throw new Error('Employee has already checked in today.');
    }

    const emp = state.employees.find(e => e.id === empId);
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: empId,
      attendanceDate: today,
      checkIn: nowIso,
      checkOut: null,
      workedHours: 0,
      overtimeHours: 0,
      status: 'PRESENT',
      employee: emp,
    };

    mockDB.updateState(draft => {
      draft.attendances.unshift(newRecord);
    });

    return newRecord;
  },

  checkOut: async (data: CheckOutDTO = {}): Promise<AttendanceRecord> => {
    const empId = data.employeeId || 'emp-1';
    const today = data.attendanceDate || new Date().toISOString().split('T')[0];
    const nowIso = data.checkOut || new Date().toISOString();
    let updated: AttendanceRecord | null = null;

    mockDB.updateState(draft => {
      const record = draft.attendances.find(
        a => a.employeeId === empId && a.attendanceDate === today
      );
      if (!record) throw new Error('No active check-in record found for today.');
      if (record.checkOut) throw new Error('Employee has already checked out today.');

      record.checkOut = nowIso;
      const calc = businessLogic.calculateWorkedHours(record.checkIn, nowIso, 1.0);
      record.workedHours = calc.workedHours;
      record.status = calc.status;
      record.overtimeHours = Math.max(0, Math.round((calc.workedHours - 8.0) * 100) / 100);
      updated = record;
    });

    if (!updated) throw new Error('Failed to checkout.');
    return updated;
  },

  correctAttendance: async (id: string, data: CorrectionDTO): Promise<AttendanceRecord> => {
    let updated: AttendanceRecord | null = null;
    mockDB.updateState(draft => {
      const record = draft.attendances.find(a => a.id === id);
      if (!record) throw new Error('Attendance record not found.');

      if (data.checkIn) record.checkIn = data.checkIn;
      if (data.checkOut) record.checkOut = data.checkOut;

      const calc = businessLogic.calculateWorkedHours(record.checkIn, record.checkOut, 1.0);
      record.workedHours = data.workedHours !== undefined ? Number(data.workedHours) : calc.workedHours;
      record.status = data.status || 'CORRECTED';
      record.overtimeHours = Math.max(0, Math.round((record.workedHours - 8.0) * 100) / 100);
      updated = record;
    });

    if (!updated) throw new Error('Failed to correct attendance.');
    return updated;
  },

  getAttendanceList: async (
    params: AttendanceFilterParams = {}
  ): Promise<{ items: AttendanceRecord[]; meta: PaginationMeta }> => {
    const state = mockDB.getState();
    let result = state.attendances.map(a => ({
      ...a,
      employee: state.employees.find(e => e.id === a.employeeId),
    }));

    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        a => a.employee?.name?.toLowerCase().includes(q) || a.employee?.employeeCode?.toLowerCase().includes(q)
      );
    }
    if (params.employeeId && params.employeeId !== 'all') {
      result = result.filter(a => a.employeeId === params.employeeId);
    }
    if (params.status && params.status !== 'all') {
      result = result.filter(a => a.status === params.status);
    }
    if (params.startDate) {
      result = result.filter(a => a.attendanceDate >= params.startDate!);
    }
    if (params.endDate) {
      result = result.filter(a => a.attendanceDate <= params.endDate!);
    }

    const page = params.page || 1;
    const limit = params.limit || 50;
    const total = result.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;

    return {
      items: result.slice(startIndex, startIndex + limit),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },
};
