import { mockDB } from './mockDatabase';
import { businessLogic } from './businessLogicEngine';
import type {
  WorkingSchedule,
  CreateWorkingScheduleDTO,
  UpdateWorkingScheduleDTO,
  WorkingScheduleFilterParams,
  PaginationMeta,
} from '../types';

export const scheduleService = {
  createSchedule: async (data: CreateWorkingScheduleDTO): Promise<any> => {
    const rawDays = data.scheduleDays || data.days || [];
    const normalizedDays = rawDays.map(d => ({
      dayOfWeek: Number(d.dayOfWeek),
      startTime: d.startTime || '09:00',
      endTime: d.endTime || '18:00',
      breakMinutes: d.breakMinutes || ((d.breakHours || 0) * 60) || 60,
      breakHours: (d.breakMinutes ? d.breakMinutes / 60 : d.breakHours) || 1.0,
      isWorking: d.isWorking !== undefined ? d.isWorking : true,
    }));

    const calculatedWeekly = businessLogic.calculateWeeklyHours(normalizedDays);

    const newSchedule: WorkingSchedule = {
      id: `sched-${Date.now()}`,
      name: data.name,
      scheduleType: data.scheduleType || 'FIXED',
      weeklyHours: calculatedWeekly,
      description: data.description || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      scheduleDays: normalizedDays,
      days: normalizedDays,
    };

    mockDB.updateState(draft => {
      draft.workingSchedules.push(newSchedule);
    });

    return { success: true, data: newSchedule };
  },

  listSchedules: async (
    params: WorkingScheduleFilterParams = {}
  ): Promise<any> => {
    const state = mockDB.getState();
    let result = state.workingSchedules;

    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q));
    }
    if (params.scheduleType && params.scheduleType !== 'all') {
      result = result.filter(s => s.scheduleType === params.scheduleType);
    }
    if (params.isActive !== undefined && params.isActive !== 'all') {
      const active = params.isActive === 'true';
      result = result.filter(s => s.isActive === active);
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

  getScheduleById: async (id: string): Promise<any> => {
    const state = mockDB.getState();
    const s = state.workingSchedules.find(item => item.id === id);
    if (!s) throw new Error('Working schedule not found');
    return { success: true, data: s };
  },

  updateSchedule: async (id: string, data: UpdateWorkingScheduleDTO): Promise<any> => {
    let updated: WorkingSchedule | null = null;
    mockDB.updateState(draft => {
      const s = draft.workingSchedules.find(item => item.id === id);
      if (s) {
        Object.assign(s, data);
        const rawDays = data.scheduleDays || data.days;
        if (rawDays) {
          const normalizedDays = rawDays.map(d => ({
            dayOfWeek: Number(d.dayOfWeek),
            startTime: d.startTime || '09:00',
            endTime: d.endTime || '18:00',
            breakMinutes: d.breakMinutes || ((d.breakHours || 0) * 60) || 60,
            breakHours: (d.breakMinutes ? d.breakMinutes / 60 : d.breakHours) || 1.0,
            isWorking: d.isWorking !== undefined ? d.isWorking : true,
          }));
          s.scheduleDays = normalizedDays;
          s.days = normalizedDays;
          s.weeklyHours = businessLogic.calculateWeeklyHours(normalizedDays);
        }
        updated = s;
      }
    });
    if (!updated) throw new Error('Schedule not found');
    return { success: true, data: updated };
  },

  toggleScheduleStatus: async (id: string, isActive?: boolean): Promise<any> => {
    let updated: WorkingSchedule | null = null;
    mockDB.updateState(draft => {
      const s = draft.workingSchedules.find(item => item.id === id);
      if (s) {
        s.isActive = isActive !== undefined ? isActive : !s.isActive;
        updated = s;
      }
    });
    if (!updated) throw new Error('Schedule not found');
    return { success: true, data: updated };
  },

  deleteSchedule: async (id: string): Promise<any> => {
    mockDB.updateState(draft => {
      draft.workingSchedules = draft.workingSchedules.filter(s => s.id !== id);
    });
    return { success: true, data: null };
  },
};

export const ScheduleService = scheduleService;
