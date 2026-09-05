/**
 * PeoplePay360 — Payroll & Salary Structure Service
 * 
 * Provides centralized frontend business logic integration for Payruns,
 * Payslips, Salary Structures, and Rules.
 */

import { mockDB } from './mockDatabase';
import { businessLogic, type PayrunValidationResult } from './businessLogicEngine';
import type {
  SalaryStructure,
  SalaryRule,
  Payrun,
  Payslip,
  Payment,
  UserRole,
} from '../types';

export const payrollService = {
  // ==========================================
  // Salary Structures
  // ==========================================
  listStructures: async (): Promise<SalaryStructure[]> => {
    const state = mockDB.getState();
    return state.salaryStructures.map(s => ({
      ...s,
      rules: state.salaryRules.filter(r => r.structureId === s.id),
    }));
  },

  getStructureById: async (id: string): Promise<SalaryStructure | null> => {
    const state = mockDB.getState();
    const s = state.salaryStructures.find(struct => struct.id === id);
    if (!s) return null;
    return {
      ...s,
      rules: state.salaryRules.filter(r => r.structureId === s.id),
    };
  },

  createStructure: async (data: Partial<SalaryStructure>): Promise<SalaryStructure> => {
    const newStruct: SalaryStructure = {
      id: `struct-${Date.now()}`,
      name: data.name || 'New Salary Structure',
      code: data.code || `CTC_${Date.now().toString().slice(-4)}`,
      description: data.description || '',
      type: data.type || 'MONTHLY',
      isActive: data.isActive !== undefined ? data.isActive : true,
      rules: [],
    };
    mockDB.updateState(draft => {
      draft.salaryStructures.push(newStruct);
    });
    return newStruct;
  },

  updateStructure: async (id: string, data: Partial<SalaryStructure>): Promise<SalaryStructure> => {
    let updated: SalaryStructure | null = null;
    mockDB.updateState(draft => {
      const s = draft.salaryStructures.find(struct => struct.id === id);
      if (s) {
        Object.assign(s, data);
        updated = s;
      }
    });
    if (!updated) throw new Error('Salary structure not found');
    return updated;
  },

  deleteStructure: async (id: string): Promise<void> => {
    mockDB.updateState(draft => {
      draft.salaryStructures = draft.salaryStructures.filter(s => s.id !== id);
      draft.salaryRules = draft.salaryRules.filter(r => r.structureId !== id);
    });
  },

  // ==========================================
  // Salary Rules
  // ==========================================
  listRules: async (structureId?: string): Promise<SalaryRule[]> => {
    const state = mockDB.getState();
    let rules = state.salaryRules;
    if (structureId && structureId !== 'all') {
      rules = rules.filter(r => r.structureId === structureId);
    }
    return [...rules].sort((a, b) => a.sequence - b.sequence);
  },

  createRule: async (data: Partial<SalaryRule>): Promise<SalaryRule> => {
    const state = mockDB.getState();
    const existingForStruct = state.salaryRules.filter(r => r.structureId === data.structureId);
    const maxSeq = existingForStruct.reduce((max, r) => Math.max(max, r.sequence), 0);

    const newRule: SalaryRule = {
      id: `rule-${Date.now()}`,
      structureId: data.structureId || 'struct-1',
      name: data.name || 'New Salary Rule',
      code: (data.code || `RULE_${Date.now().toString().slice(-4)}`).toUpperCase(),
      category: data.category || 'ALLOWANCE',
      sequence: data.sequence !== undefined ? data.sequence : maxSeq + 1,
      type: data.type || 'PERCENTAGE',
      amount: data.amount,
      rate: data.rate,
      pythonCode: data.pythonCode,
      conditionType: data.conditionType || 'ALWAYS_TRUE',
      isDeduction: data.isDeduction || data.category === 'DEDUCTION',
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    mockDB.updateState(draft => {
      draft.salaryRules.push(newRule);
    });
    return newRule;
  },

  updateRule: async (id: string, data: Partial<SalaryRule>): Promise<SalaryRule> => {
    let updated: SalaryRule | null = null;
    mockDB.updateState(draft => {
      const r = draft.salaryRules.find(rule => rule.id === id);
      if (r) {
        Object.assign(r, data);
        if (data.category === 'DEDUCTION') r.isDeduction = true;
        updated = r;
      }
    });
    if (!updated) throw new Error('Salary rule not found');
    return updated;
  },

  deleteRule: async (id: string): Promise<void> => {
    mockDB.updateState(draft => {
      draft.salaryRules = draft.salaryRules.filter(r => r.id !== id);
    });
  },

  // ==========================================
  // Payruns
  // ==========================================
  listPayruns: async (): Promise<Payrun[]> => {
    const state = mockDB.getState();
    return state.payruns;
  },

  getPayrunById: async (id: string): Promise<Payrun | null> => {
    const state = mockDB.getState();
    return state.payruns.find(p => p.id === id) || null;
  },

  validatePrerequisites: (
    periodStart: string,
    periodEnd: string,
    structureId: string,
    employeeIds: string[]
  ): PayrunValidationResult => {
    return businessLogic.validatePayrunPrerequisites(periodStart, periodEnd, structureId, employeeIds);
  },

  createAndComputePayrun: async (
    name: string,
    periodStart: string,
    periodEnd: string,
    structureId: string,
    employeeIds: string[],
    actorName?: string,
    actorRole?: UserRole
  ): Promise<{ payrun: Payrun; payslips: Payslip[] }> => {
    return businessLogic.createAndComputePayrun(name, periodStart, periodEnd, structureId, employeeIds, actorName, actorRole);
  },

  validatePayrun: async (payrunId: string, actorName?: string, actorRole?: UserRole): Promise<boolean> => {
    return businessLogic.validatePayrunStatus(payrunId, actorName, actorRole);
  },

  markPaid: async (payrunId: string, actorName?: string, actorRole?: UserRole): Promise<boolean> => {
    return businessLogic.markPayrunAsPaid(payrunId, actorName, actorRole);
  },

  // ==========================================
  // Payslips
  // ==========================================
  listPayslips: async (params?: { payrunId?: string; employeeId?: string; status?: string }): Promise<Payslip[]> => {
    const state = mockDB.getState();
    let result = state.payslips;
    if (params?.payrunId) result = result.filter(ps => ps.payrunId === params.payrunId);
    if (params?.employeeId) result = result.filter(ps => ps.employeeId === params.employeeId);
    if (params?.status && params.status !== 'all') result = result.filter(ps => ps.status === params.status);
    return result;
  },

  getPayslipById: async (id: string): Promise<Payslip | null> => {
    const state = mockDB.getState();
    return state.payslips.find(ps => ps.id === id) || null;
  },

  // ==========================================
  // Payments
  // ==========================================
  listPayments: async (): Promise<Payment[]> => {
    const state = mockDB.getState();
    return state.payments;
  },
};
