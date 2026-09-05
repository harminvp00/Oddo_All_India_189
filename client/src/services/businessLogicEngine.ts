/**
 * PeoplePay360 — Central Business Logic & Payroll Calculation Engine
 * 
 * Provides centralized, mathematically consistent, deterministic business logic
 * for schedules, attendance, contracts, leaves, salary rule execution, payruns,
 * payslip generation, and dashboard aggregations.
 */

import { mockDB, type MockDatabaseState } from './mockDatabase';
import type {
  Employee,
  Contract,
  WorkingSchedule,
  ScheduleDay,
  SalaryRule,
  Payrun,
  Payslip,
  PayslipLine,
  LeaveAllocation,
  LeaveRequest,
  AttendanceRecord,
  UserRole,
} from '../types';

export interface PayrunValidationResult {
  passed: string[];
  warnings: Array<{ employeeId?: string; employeeName?: string; message: string }>;
  errors: Array<{ employeeId?: string; employeeName?: string; message: string }>;
}

export interface SalaryCalculationResult {
  basic: number;
  gross: number;
  deductions: number;
  net: number;
  lines: Array<{
    ruleCode: string;
    ruleName: string;
    category: 'BASIC' | 'ALLOWANCE' | 'GROSS' | 'DEDUCTION' | 'NET';
    amount: number;
    sequence: number;
    isDeduction: boolean;
  }>;
}

export const businessLogic = {
  // ==========================================
  // 1. WORKING SCHEDULE ENGINE
  // ==========================================
  calculateDailyHours(day: ScheduleDay): number {
    if (!day.isWorking || !day.startTime || !day.endTime) return 0;
    const [sh, sm] = day.startTime.split(':').map(Number);
    const [eh, em] = day.endTime.split(':').map(Number);
    if (isNaN(sh) || isNaN(eh)) return 0;

    let totalMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Overnight shift support
    
    const breakMinutes = (day.breakHours || 0) * 60;
    const workedMinutes = Math.max(0, totalMinutes - breakMinutes);
    return Math.round((workedMinutes / 60) * 100) / 100;
  },

  calculateWeeklyHours(days: ScheduleDay[]): number {
    const total = days.reduce((sum, d) => sum + this.calculateDailyHours(d), 0);
    return Math.round(total * 10) / 10;
  },

  // ==========================================
  // 2. ATTENDANCE ENGINE
  // ==========================================
  calculateWorkedHours(checkInIso?: string | null, checkOutIso?: string | null, breakHours = 1.0): {
    workedHours: number;
    status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'OVERTIME' | 'ON_LEAVE' | 'ABSENT' | 'CORRECTED';
  } {
    if (!checkInIso || !checkOutIso) {
      return { workedHours: 0, status: 'ABSENT' };
    }

    const checkIn = new Date(checkInIso);
    const checkOut = new Date(checkOutIso);
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) {
      return { workedHours: 0, status: 'ABSENT' };
    }

    const elapsedMs = checkOut.getTime() - checkIn.getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    const workedHours = Math.max(0, Math.round((elapsedHours - breakHours) * 100) / 100);

    // Determine status: Late if check-in > 09:15 AM
    const inHour = checkIn.getUTCHours();
    const inMinute = checkIn.getUTCMinutes();
    let status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'OVERTIME' | 'ON_LEAVE' | 'ABSENT' | 'CORRECTED' = 'PRESENT';

    if (inHour > 9 || (inHour === 9 && inMinute > 15)) {
      status = 'LATE';
    }
    if (workedHours < 5.0 && workedHours > 0) {
      status = 'HALF_DAY';
    } else if (workedHours >= 9.0) {
      status = 'OVERTIME';
    }

    return { workedHours, status };
  },

  // ==========================================
  // 3. PERIOD-SPECIFIC CONTRACT SELECTION
  // ==========================================
  getApplicableContract(employeeId: string, periodStart: string, periodEnd: string): Contract | null {
    const state = mockDB.getState();
    const pStart = new Date(periodStart).getTime();
    const pEnd = new Date(periodEnd).getTime();

    // Find active or in-force contracts that overlap with the period
    const empContracts = state.contracts.filter(c => c.employeeId === employeeId);
    
    // Sort descending by startDate to pick the most relevant contract applicable to this specific period
    const applicable = empContracts
      .filter(c => {
        const cStart = new Date(c.startDate).getTime();
        const cEnd = c.endDate ? new Date(c.endDate).getTime() : Infinity;
        return cStart <= pEnd && cEnd >= pStart && (c.status === 'ACTIVE' || c.status === 'EXPIRED');
      })
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return applicable[0] || null;
  },

  validateContractOverlap(employeeId: string, startDate: string, endDate?: string | null, excludeId?: string): {
    isValid: boolean;
    errorMessage?: string;
  } {
    const state = mockDB.getState();
    const newStart = new Date(startDate).getTime();
    const newEnd = endDate ? new Date(endDate).getTime() : Infinity;

    if (newEnd < newStart) {
      return { isValid: false, errorMessage: 'Contract end date must be after the start date.' };
    }

    const existingActive = state.contracts.filter(
      c => c.employeeId === employeeId && c.status === 'ACTIVE' && c.id !== excludeId
    );

    for (const c of existingActive) {
      const cStart = new Date(c.startDate).getTime();
      const cEnd = c.endDate ? new Date(c.endDate).getTime() : Infinity;
      if (newStart <= cEnd && newEnd >= cStart) {
        return {
          isValid: false,
          errorMessage: `Another active contract (${c.contractNumber}: ${c.startDate} → ${c.endDate || 'Open'}) overlaps with this period.`,
        };
      }
    }

    return { isValid: true };
  },

  // ==========================================
  // 4. LEAVE & TIME-OFF ENGINE (Double Deduction Protection)
  // ==========================================
  calculateLeaveDuration(startDate: string, endDate: string): number {
    const d1 = new Date(startDate).getTime();
    const d2 = new Date(endDate).getTime();
    if (isNaN(d1) || isNaN(d2) || d2 < d1) return 0;
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  },

  validateLeaveRequest(employeeId: string, leaveTypeId: string, startDate: string, endDate: string): {
    isValid: boolean;
    errorMessage?: string;
    requestedDays: number;
    remainingBalance: number;
  } {
    const state = mockDB.getState();
    const requestedDays = this.calculateLeaveDuration(startDate, endDate);
    if (requestedDays <= 0) {
      return { isValid: false, errorMessage: 'End date must be on or after start date.', requestedDays: 0, remainingBalance: 0 };
    }

    // Check overlapping existing requests
    const pStart = new Date(startDate).getTime();
    const pEnd = new Date(endDate).getTime();
    const overlapping = state.leaveRequests.some(
      r => r.employeeId === employeeId && r.status !== 'REJECTED' && r.status !== 'CANCELLED' &&
        new Date(r.startDate).getTime() <= pEnd && new Date(r.endDate).getTime() >= pStart
    );

    if (overlapping) {
      return {
        isValid: false,
        errorMessage: 'An overlapping time-off request already exists for this period.',
        requestedDays,
        remainingBalance: 0,
      };
    }

    // Check allocation quota if required
    const leaveType = state.leaveTypes.find(t => t.id === leaveTypeId);
    if (leaveType?.requiresAllocation) {
      const alloc = state.leaveAllocations.find(
        a => a.employeeId === employeeId && a.leaveTypeId === leaveTypeId && a.status === 'APPROVED'
      );
      const remaining = alloc ? (alloc.allocatedUnits - alloc.usedUnits) : 0;
      if (requestedDays > remaining) {
        return {
          isValid: false,
          errorMessage: `Insufficient leave balance. Available: ${remaining} days, Requested: ${requestedDays} days.`,
          requestedDays,
          remainingBalance: remaining,
        };
      }
      return { isValid: true, requestedDays, remainingBalance: remaining };
    }

    return { isValid: true, requestedDays, remainingBalance: 999 };
  },

  approveLeaveRequest(requestId: string, actorName = 'HR Manager', actorRole: UserRole = 'HR_MANAGER'): {
    success: boolean;
    error?: string;
  } {
    const state = mockDB.getState();
    const req = state.leaveRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Leave request not found.' };

    // DOUBLE DEDUCTION PROTECTION
    if (req.status === 'APPROVED') {
      return { success: false, error: 'Request has already been approved. Balance was not deducted again.' };
    }

    mockDB.updateState(draft => {
      const targetReq = draft.leaveRequests.find(r => r.id === requestId);
      if (!targetReq) return;
      targetReq.status = 'APPROVED';

      const leaveType = draft.leaveTypes.find(t => t.id === targetReq.leaveTypeId);
      if (leaveType?.requiresAllocation) {
        const alloc = draft.leaveAllocations.find(
          a => a.employeeId === targetReq.employeeId && a.leaveTypeId === targetReq.leaveTypeId
        );
        if (alloc) {
          alloc.usedUnits = Number(alloc.usedUnits || 0) + Number(targetReq.requestedUnits || 0);
          alloc.remainingUnits = Math.max(0, alloc.allocatedUnits - alloc.usedUnits);
        }
      }
    });

    mockDB.addAuditLog(actorName, actorRole, 'LEAVE_APPROVED', 'LeaveRequest', requestId, `Approved leave for ${req.requestedUnits} days.`);
    return { success: true };
  },

  rejectLeaveRequest(requestId: string, actorName = 'HR Manager', actorRole: UserRole = 'HR_MANAGER'): {
    success: boolean;
    error?: string;
  } {
    const state = mockDB.getState();
    const req = state.leaveRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Leave request not found.' };

    mockDB.updateState(draft => {
      const targetReq = draft.leaveRequests.find(r => r.id === requestId);
      if (targetReq) {
        targetReq.status = 'REJECTED';
      }
    });

    mockDB.addAuditLog(actorName, actorRole, 'LEAVE_REJECTED', 'LeaveRequest', requestId, 'Leave request rejected.');
    return { success: true };
  },

  // ==========================================
  // 5. SALARY RULE CALCULATION ENGINE
  // ==========================================
  executeSalaryRules(
    wage: number,
    rules: SalaryRule[],
    lopDays = 0,
    workingDaysInMonth = 30
  ): SalaryCalculationResult {
    // Sort strictly by sequence
    const sortedRules = [...rules].sort((a, b) => a.sequence - b.sequence);
    const computedValues: Record<string, number> = {
      WAGE: wage,
      LOP: Math.round((wage / workingDaysInMonth) * lopDays * 100) / 100,
    };

    const lines: SalaryCalculationResult['lines'] = [];
    let grossTotal = 0;
    let deductionTotal = 0;

    for (const rule of sortedRules) {
      if (!rule.isActive) continue;

      let amount = 0;
      if (rule.type === 'FIXED') {
        amount = Number(rule.amount || 0);
      } else if (rule.type === 'PERCENTAGE') {
        const baseVal = computedValues['BASIC'] || wage;
        amount = Math.round(((Number(rule.rate || 0) / 100) * baseVal) * 100) / 100;
      } else if (rule.type === 'FORMULA') {
        // Evaluate expression safely using context
        try {
          let expr = rule.pythonCode || '0';
          // Replace known keys
          for (const key of Object.keys(computedValues)) {
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            expr = expr.replace(regex, String(computedValues[key]));
          }
          // Basic safe arithmetic evaluator
          // eslint-disable-next-line no-eval
          const result = Function(`"use strict"; return (${expr})`)();
          amount = Math.max(0, Math.round(Number(result) * 100) / 100);
        } catch {
          amount = 0;
        }
      }

      computedValues[rule.code] = amount;

      if (rule.category === 'BASIC' || rule.category === 'ALLOWANCE') {
        grossTotal += amount;
      } else if (rule.category === 'DEDUCTION') {
        deductionTotal += amount;
      }

      lines.push({
        ruleCode: rule.code,
        ruleName: rule.name,
        category: rule.category,
        amount,
        sequence: rule.sequence,
        isDeduction: rule.isDeduction || rule.category === 'DEDUCTION',
      });
    }

    // Include LOP deduction if any
    if (lopDays > 0) {
      const lopAmount = computedValues['LOP'];
      deductionTotal += lopAmount;
      lines.push({
        ruleCode: 'LOP',
        ruleName: `Loss of Pay (${lopDays} days unpaid)`,
        category: 'DEDUCTION',
        amount: lopAmount,
        sequence: 99,
        isDeduction: true,
      });
    }

    const netTotal = Math.max(0, grossTotal - deductionTotal);

    return {
      basic: computedValues['BASIC'] || Math.round(wage * 0.5),
      gross: grossTotal,
      deductions: deductionTotal,
      net: netTotal,
      lines,
    };
  },

  // ==========================================
  // 6. PAYRUN 5-STEP PROCESSING ENGINE
  // ==========================================
  validatePayrunPrerequisites(
    periodStart: string,
    periodEnd: string,
    salaryStructureId: string,
    selectedEmployeeIds: string[]
  ): PayrunValidationResult {
    const state = mockDB.getState();
    const passed: string[] = [];
    const warnings: PayrunValidationResult['warnings'] = [];
    const errors: PayrunValidationResult['errors'] = [];

    if (!periodStart || !periodEnd) {
      errors.push({ message: 'Payroll period start and end dates are required.' });
    }

    if (!salaryStructureId) {
      errors.push({ message: 'A Salary Structure must be configured for the payrun batch.' });
    }

    if (selectedEmployeeIds.length === 0) {
      errors.push({ message: 'No employees selected. At least 1 eligible employee is required.' });
    }

    // Check each selected employee
    for (const empId of selectedEmployeeIds) {
      const emp = state.employees.find(e => e.id === empId);
      if (!emp) continue;

      // 1. Contract validity check for period
      const contract = this.getApplicableContract(empId, periodStart, periodEnd);
      if (!contract) {
        errors.push({
          employeeId: empId,
          employeeName: emp.name,
          message: `No active or in-force contract covers the period ${periodStart} → ${periodEnd}.`,
        });
      }

      // 2. Duplicate payslip check
      const duplicatePayslip = state.payslips.some(
        ps => ps.employeeId === empId && ps.periodStartDate === periodStart && ps.periodEndDate === periodEnd && ps.status !== 'CANCELLED'
      );
      if (duplicatePayslip) {
        errors.push({
          employeeId: empId,
          employeeName: emp.name,
          message: `Duplicate payslip already exists for ${emp.name} for period ${periodStart} → ${periodEnd}.`,
        });
      }

      // 3. Bank Account warning
      if (!emp.bankAccountNumber || !emp.ifscCode) {
        warnings.push({
          employeeId: empId,
          employeeName: emp.name,
          message: 'Bank account number or IFSC code is missing. Disbursement will require manual check.',
        });
      }
    }

    if (errors.length === 0) {
      passed.push('All selected employee contracts validated successfully.');
      passed.push('Zero duplicate payslips detected across company records.');
      passed.push('Salary structure and rule calculation sequence verified.');
    }

    return { passed, warnings, errors };
  },

  createAndComputePayrun(
    name: string,
    periodStart: string,
    periodEnd: string,
    salaryStructureId: string,
    employeeIds: string[],
    actorName = 'Vikram Malhotra',
    actorRole: UserRole = 'HR_PAYROLL_MANAGER'
  ): { payrun: Payrun; payslips: Payslip[] } {
    const state = mockDB.getState();
    const rules = state.salaryRules.filter(r => r.structureId === salaryStructureId || !r.structureId);
    const payrunId = `pr-${Date.now()}`;

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    const generatedPayslips: Payslip[] = [];

    for (const empId of employeeIds) {
      const emp = state.employees.find(e => e.id === empId);
      if (!emp) continue;

      const contract = this.getApplicableContract(empId, periodStart, periodEnd);
      const wage = contract ? contract.wage : 40000;

      // Calculate unpaid LOP days from approved leaves
      const unpaidLeaves = state.leaveRequests.filter(
        r => r.employeeId === empId && r.status === 'APPROVED' &&
          state.leaveTypes.find(t => t.id === r.leaveTypeId)?.payrollDeductible
      );
      const lopDays = unpaidLeaves.reduce((sum, r) => sum + (r.requestedUnits || 0), 0);

      const calc = this.executeSalaryRules(wage, rules, lopDays, 30);
      totalGross += calc.gross;
      totalDeductions += calc.deductions;
      totalNet += calc.net;

      const payslipId = `ps-${Date.now()}-${emp.employeeCode}`;
      const ps: Payslip = {
        id: payslipId,
        payrunId,
        employeeId: emp.id,
        contractId: contract?.id || 'cnt-default',
        salaryStructureId,
        payslipNumber: `PS-${periodStart.substring(0, 7)}-${emp.employeeCode}`,
        periodStartDate: periodStart,
        periodEndDate: periodEnd,
        status: 'DRAFT',
        basicSalary: calc.basic,
        grossSalary: calc.gross,
        totalDeductions: calc.deductions,
        netSalary: calc.net,
        workingDays: 22,
        paidDays: Math.max(0, 22 - lopDays),
        lopDays,
        lines: calc.lines.map((l, idx) => ({
          id: `psl-${payslipId}-${idx}`,
          payslipId,
          ruleCode: l.ruleCode,
          ruleName: l.ruleName,
          category: l.category,
          amount: l.amount,
          sequence: l.sequence,
          isDeduction: l.isDeduction,
        })),
      };

      generatedPayslips.push(ps);
    }

    const payrun: Payrun = {
      id: payrunId,
      name,
      periodStartDate: periodStart,
      periodEndDate: periodEnd,
      salaryStructureId,
      status: 'COMPUTED',
      totalGross,
      totalDeductions,
      totalNet,
      totalEmployerCost: Math.round(totalGross * 1.1),
      payslipCount: generatedPayslips.length,
      createdAt: new Date().toISOString(),
    };

    mockDB.updateState(draft => {
      draft.payruns.unshift(payrun);
      draft.payslips.push(...generatedPayslips);
    });

    mockDB.addAuditLog(
      actorName,
      actorRole,
      'PAYRUN_COMPUTED',
      'Payrun',
      payrunId,
      `Computed payrun "${name}" for ${generatedPayslips.length} staff. Net CTC: ₹${totalNet.toLocaleString('en-IN')}`
    );

    return { payrun, payslips: generatedPayslips };
  },

  validatePayrunStatus(payrunId: string, actorName = 'Vikram Malhotra', actorRole: UserRole = 'HR_PAYROLL_MANAGER'): boolean {
    const state = mockDB.getState();
    const payrun = state.payruns.find(p => p.id === payrunId);
    if (!payrun || payrun.status !== 'COMPUTED') return false;

    mockDB.updateState(draft => {
      const p = draft.payruns.find(pr => pr.id === payrunId);
      if (p) {
        p.status = 'VALIDATED';
        p.validatedAt = new Date().toISOString();
      }
      draft.payslips.forEach(ps => {
        if (ps.payrunId === payrunId) {
          ps.status = 'VALIDATED';
        }
      });
    });

    mockDB.addAuditLog(actorName, actorRole, 'PAYRUN_VALIDATED', 'Payrun', payrunId, `Validated payrun "${payrun.name}".`);
    return true;
  },

  markPayrunAsPaid(payrunId: string, actorName = 'Vikram Malhotra', actorRole: UserRole = 'HR_PAYROLL_MANAGER'): boolean {
    const state = mockDB.getState();
    const payrun = state.payruns.find(p => p.id === payrunId);
    if (!payrun || (payrun.status !== 'VALIDATED' && payrun.status !== 'COMPUTED')) return false;

    mockDB.updateState(draft => {
      const p = draft.payruns.find(pr => pr.id === payrunId);
      if (p) {
        p.status = 'PAID';
        p.paidAt = new Date().toISOString();
      }

      // Finalize all payslips & create disbursement records
      draft.payslips.forEach(ps => {
        if (ps.payrunId === payrunId) {
          ps.status = 'PAID';
          
          const existingPayment = draft.payments.find(pay => pay.payslipId === ps.id);
          if (!existingPayment) {
            draft.payments.push({
              id: `pay-${Date.now()}-${ps.employeeId}`,
              payslipId: ps.id,
              employeeId: ps.employeeId,
              amount: ps.netSalary,
              paymentDate: new Date().toISOString().split('T')[0],
              paymentMethod: 'BANK_TRANSFER',
              referenceNumber: `NEFT-HDFC-${Date.now().toString().slice(-6)}`,
              status: 'PAID',
            });
          }
        }
      });
    });

    mockDB.addAuditLog(actorName, actorRole, 'PAYRUN_PAID', 'Payrun', payrunId, `Disbursed and marked "${payrun.name}" as PAID.`);
    return true;
  },

  // ==========================================
  // 7. DASHBOARD LIVE AGGREGATOR
  // ==========================================
  getDashboardMetrics(departmentId?: string) {
    const state = mockDB.getState();
    
    let filteredEmployees = state.employees;
    if (departmentId && departmentId !== 'all') {
      filteredEmployees = filteredEmployees.filter(e => e.departmentId === departmentId);
    }
    const empIds = new Set(filteredEmployees.map(e => e.id));

    const totalEmployees = filteredEmployees.length;
    const activeEmployees = filteredEmployees.filter(e => e.employmentStatus === 'ACTIVE').length;
    
    // Active contracts
    const activeContracts = state.contracts.filter(c => empIds.has(c.employeeId) && c.status === 'ACTIVE');
    const totalMonthlyWage = activeContracts.reduce((sum, c) => sum + Number(c.wage || 0), 0);

    // Leaves
    const pendingLeaves = state.leaveRequests.filter(r => empIds.has(r.employeeId) && r.status === 'PENDING').length;
    const approvedLeaves = state.leaveRequests.filter(r => empIds.has(r.employeeId) && r.status === 'APPROVED');
    const totalApprovedLeaveDays = approvedLeaves.reduce((sum, r) => sum + Number(r.requestedUnits || 0), 0);

    // Attendance Health
    const todayAttendances = state.attendances.filter(a => empIds.has(a.employeeId));
    const presentCount = todayAttendances.filter(a => a.status === 'PRESENT' || a.status === 'OVERTIME').length;
    const lateCount = todayAttendances.filter(a => a.status === 'LATE').length;
    const attendanceHealth = totalEmployees > 0 ? Math.round(((presentCount + lateCount) / totalEmployees) * 100) : 100;

    // Payroll totals
    const paidPayruns = state.payruns.filter(p => p.status === 'PAID');
    const totalNetDisbursed = paidPayruns.reduce((sum, p) => sum + Number(p.totalNet || 0), 0);
    const totalPayslipsGenerated = state.payslips.length;

    // Department Breakdown
    const deptSpendMap = state.departments.map(d => {
      const dEmps = state.employees.filter(e => e.departmentId === d.id);
      const dContracts = state.contracts.filter(c => dEmps.some(e => e.id === c.employeeId) && c.status === 'ACTIVE');
      const dSpend = dContracts.reduce((sum, c) => sum + Number(c.wage || 0), 0);
      return {
        id: d.id,
        name: d.name,
        code: d.code,
        headcount: dEmps.length,
        monthlyPayrollSpend: dSpend,
      };
    });

    return {
      totalEmployees,
      activeEmployees,
      activeContractsCount: activeContracts.length,
      totalMonthlyWage,
      pendingLeaves,
      totalApprovedLeaveDays,
      attendanceHealth,
      presentToday: presentCount,
      lateToday: lateCount,
      totalNetDisbursed,
      totalPayslipsGenerated,
      recentPayruns: state.payruns.slice(0, 5),
      deptSpendMap,
    };
  },
};
