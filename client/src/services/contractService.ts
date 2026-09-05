import { mockDB } from './mockDatabase';
import { businessLogic } from './businessLogicEngine';
import { payrollService } from './payrollService';
import type {
  Contract,
  CreateContractDTO,
  UpdateContractDTO,
  ContractFilterParams,
  SalaryStructure,
  PaginationMeta,
} from '../types';

export const contractService = {
  createContract: async (data: CreateContractDTO): Promise<Contract> => {
    // Validate overlap and date validity
    const val = businessLogic.validateContractOverlap(
      data.employeeId,
      data.startDate,
      data.endDate
    );
    if (!val.isValid) {
      throw new Error(val.errorMessage || 'Invalid contract dates');
    }

    const state = mockDB.getState();
    const emp = state.employees.find(e => e.id === data.employeeId);
    const struct = state.salaryStructures.find(s => s.id === data.salaryStructureId);
    const dept = state.departments.find(d => d.id === data.departmentId);
    const pos = state.jobPositions.find(p => p.id === data.positionId);
    const sched = state.workingSchedules.find(s => s.id === data.scheduleId);

    const newContract: Contract = {
      id: `cnt-${Date.now()}`,
      employeeId: data.employeeId,
      contractNumber: data.contractNumber || `CNT-${new Date().getFullYear()}-${String(state.contracts.length + 1).padStart(3, '0')}`,
      wage: Number(data.wage),
      startDate: data.startDate,
      endDate: data.endDate || null,
      status: data.status || 'ACTIVE',
      currencyCode: data.currencyCode || 'INR',
      salaryStructureId: data.salaryStructureId,
      departmentId: data.departmentId,
      positionId: data.positionId,
      scheduleId: data.scheduleId,
      employee: emp,
      salaryStructure: struct,
      department: dept,
      position: pos,
      schedule: sched,
    };

    mockDB.updateState(draft => {
      draft.contracts.unshift(newContract);
    });

    return newContract;
  },

  listContracts: async (
    params: ContractFilterParams = {}
  ): Promise<{ items: Contract[]; meta: PaginationMeta }> => {
    const state = mockDB.getState();
    let result = state.contracts.map(c => ({
      ...c,
      employee: state.employees.find(e => e.id === c.employeeId),
      salaryStructure: state.salaryStructures.find(s => s.id === c.salaryStructureId),
      department: state.departments.find(d => d.id === c.departmentId),
      position: state.jobPositions.find(p => p.id === c.positionId),
      schedule: state.workingSchedules.find(s => s.id === c.scheduleId),
    }));

    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        c => c.contractNumber.toLowerCase().includes(q) || c.employee?.name?.toLowerCase().includes(q)
      );
    }
    if (params.employeeId && params.employeeId !== 'all') {
      result = result.filter(c => c.employeeId === params.employeeId);
    }
    if (params.status && params.status !== 'ALL') {
      result = result.filter(c => c.status === params.status);
    }
    if (params.salaryStructureId && params.salaryStructureId !== 'all') {
      result = result.filter(c => c.salaryStructureId === params.salaryStructureId);
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

  getContractById: async (id: string): Promise<Contract> => {
    const state = mockDB.getState();
    const c = state.contracts.find(item => item.id === id);
    if (!c) throw new Error('Contract not found');
    return {
      ...c,
      employee: state.employees.find(e => e.id === c.employeeId),
      salaryStructure: state.salaryStructures.find(s => s.id === c.salaryStructureId),
      department: state.departments.find(d => d.id === c.departmentId),
      position: state.jobPositions.find(p => p.id === c.positionId),
      schedule: state.workingSchedules.find(s => s.id === c.scheduleId),
    };
  },

  listSalaryStructures: async (): Promise<SalaryStructure[]> => {
    return payrollService.listStructures();
  },

  updateContract: async (id: string, data: UpdateContractDTO): Promise<Contract> => {
    let updated: Contract | null = null;
    mockDB.updateState(draft => {
      const c = draft.contracts.find(item => item.id === id);
      if (c) {
        Object.assign(c, data);
        updated = c;
      }
    });
    if (!updated) throw new Error('Contract not found');
    return updated;
  },

  deleteContract: async (id: string): Promise<void> => {
    mockDB.updateState(draft => {
      draft.contracts = draft.contracts.filter(c => c.id !== id);
    });
  },
};
