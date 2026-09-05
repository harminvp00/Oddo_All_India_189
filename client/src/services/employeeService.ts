import { mockDB } from './mockDatabase';
import type {
  Employee,
  EmployeeSummary,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  EmployeeFilterParams,
  PaginationMeta,
} from '../types';

export const employeeService = {
  createEmployee: async (data: CreateEmployeeDTO): Promise<Employee> => {
    const state = mockDB.getState();
    const newEmpCode = data.employeeCode || `EMP${String(state.employees.length + 1).padStart(4, '0')}`;
    
    // Check unique email
    if (data.email && state.employees.some(e => e.email && e.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error(`An employee with email ${data.email} already exists.`);
    }

    const dept = state.departments.find(d => d.id === data.departmentId);
    const pos = state.jobPositions.find(p => p.id === data.positionId);
    const sched = state.workingSchedules.find(s => s.id === data.scheduleId);

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      employeeCode: newEmpCode,
      name: `${data.firstName} ${data.lastName}`.trim(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      departmentId: data.departmentId || null,
      positionId: data.positionId || null,
      scheduleId: data.scheduleId || 'sched-1',
      hireDate: data.hireDate,
      employmentStatus: data.employmentStatus || 'ACTIVE',
      employeeType: data.employeeType || 'FULL_TIME',
      department: dept,
      position: pos,
      schedule: sched ? {
        id: sched.id,
        name: sched.name,
        scheduleType: sched.scheduleType,
        weeklyHours: sched.weeklyHours,
      } : undefined,
      bankName: data.bankName || null,
      bankAccountNumber: data.bankAccountNumber || null,
      bankAccountName: data.bankAccountName || `${data.firstName} ${data.lastName}`,
      ifscCode: data.ifscCode || null,
      panNumber: data.panNumber || null,
      uanNumber: data.uanNumber || null,
      avatarUrl: data.avatarUrl || null,
    };

    mockDB.updateState(draft => {
      draft.employees.unshift(newEmp);
      if (dept) {
        const d = draft.departments.find(x => x.id === dept.id);
        if (d) d.employeeCount = (d.employeeCount || 0) + 1;
      }
    });

    return newEmp;
  },

  listEmployees: async (
    params: EmployeeFilterParams = {}
  ): Promise<{ items: Employee[]; meta: PaginationMeta }> => {
    const state = mockDB.getState();
    let result = state.employees.map(emp => ({
      ...emp,
      department: state.departments.find(d => d.id === emp.departmentId),
      position: state.jobPositions.find(p => p.id === emp.positionId),
      schedule: state.workingSchedules.find(s => s.id === emp.scheduleId) ? {
        id: emp.scheduleId!,
        name: state.workingSchedules.find(s => s.id === emp.scheduleId)!.name,
        scheduleType: state.workingSchedules.find(s => s.id === emp.scheduleId)!.scheduleType,
        weeklyHours: state.workingSchedules.find(s => s.id === emp.scheduleId)!.weeklyHours,
      } : undefined,
    }));

    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        e => (e.name && e.name.toLowerCase().includes(q)) ||
             (e.employeeCode && e.employeeCode.toLowerCase().includes(q)) ||
             (e.email && e.email.toLowerCase().includes(q))
      );
    }
    if (params.departmentId && params.departmentId !== 'all') {
      result = result.filter(e => e.departmentId === params.departmentId);
    }
    if (params.positionId && params.positionId !== 'all') {
      result = result.filter(e => e.positionId === params.positionId);
    }
    if (params.status && params.status !== 'all') {
      result = result.filter(e => e.employmentStatus === params.status);
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

  getEmployeeById: async (id: string): Promise<Employee> => {
    const state = mockDB.getState();
    const emp = state.employees.find(e => e.id === id);
    if (!emp) throw new Error('Employee not found');
    const sched = state.workingSchedules.find(s => s.id === emp.scheduleId);
    return {
      ...emp,
      department: state.departments.find(d => d.id === emp.departmentId),
      position: state.jobPositions.find(p => p.id === emp.positionId),
      schedule: sched ? {
        id: sched.id,
        name: sched.name,
        scheduleType: sched.scheduleType,
        weeklyHours: sched.weeklyHours,
      } : undefined,
    };
  },

  updateEmployee: async (id: string, data: UpdateEmployeeDTO): Promise<Employee> => {
    let updated: Employee | null = null;
    mockDB.updateState(draft => {
      const emp = draft.employees.find(e => e.id === id);
      if (emp) {
        Object.assign(emp, data);
        if (data.firstName || data.lastName) {
          emp.name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
        }
        updated = emp;
      }
    });
    if (!updated) throw new Error('Employee not found');
    return updated;
  },

  getEmployeeSummary: async (id: string): Promise<EmployeeSummary> => {
    const state = mockDB.getState();
    const emp = state.employees.find(e => e.id === id);
    if (!emp) throw new Error('Employee not found');

    const contracts = state.contracts.filter(c => c.employeeId === id);
    const activeContract = contracts.find(c => c.status === 'ACTIVE');
    const attendances = state.attendances.filter(a => a.employeeId === id);
    const leaves = state.leaveRequests.filter(r => r.employeeId === id);
    const approvedLeaves = leaves.filter(r => r.status === 'APPROVED');
    const allocations = state.leaveAllocations.filter(a => a.employeeId === id && a.status === 'APPROVED');
    const totalRemaining = allocations.reduce((sum, a) => sum + (a.allocatedUnits - a.usedUnits), 0);
    const payslips = state.payslips.filter(ps => ps.employeeId === id);
    const payments = state.payments.filter(pay => pay.employeeId === id);

    let structName = 'Standard CTC Structure';
    if (activeContract) {
      const s = state.salaryStructures.find(struct => struct.id === activeContract.salaryStructureId);
      if (s) structName = s.name;
    }

    return {
      employee: {
        id: emp.id,
        employeeCode: emp.employeeCode,
        name: emp.name,
        email: emp.email,
        departmentName: state.departments.find(d => d.id === emp.departmentId)?.name || 'General',
        positionTitle: state.jobPositions.find(p => p.id === emp.positionId)?.title || 'Staff',
      },
      counts: {
        contracts: contracts.length,
        attendanceDays: attendances.length,
        timeOffRequests: leaves.length,
        approvedLeaves: approvedLeaves.length,
        remainingLeaveDays: totalRemaining,
        payslips: payslips.length,
        payments: payments.length,
      },
      activeContract: activeContract
        ? {
            id: activeContract.id,
            contractNumber: activeContract.contractNumber,
            wage: Number(activeContract.wage),
            startDate: activeContract.startDate,
            endDate: activeContract.endDate,
            salaryStructureName: structName,
          }
        : null,
    };
  },

  deleteEmployee: async (id: string): Promise<void> => {
    mockDB.updateState(draft => {
      draft.employees = draft.employees.filter(e => e.id !== id);
    });
  },
};
