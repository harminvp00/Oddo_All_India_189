/**
 * PeoplePay360 — Central Relational Mock Database & Deterministic State Store
 * 
 * Provides an enterprise-grade, internally consistent, normalized state store
 * persisted in localStorage with deterministic initial seeding.
 */

import type {
  Employee,
  Department,
  JobPosition,
  Contract,
  WorkingSchedule,
  LeaveType,
  LeaveAllocation,
  LeaveRequest,
  AttendanceRecord,
  SalaryStructure,
  SalaryRule,
  Payrun,
  Payslip,
  Payment,
  User,
  UserRole,
} from '../types';

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
}

export interface MockDatabaseState {
  users: User[];
  departments: Department[];
  jobPositions: JobPosition[];
  workingSchedules: WorkingSchedule[];
  employees: Employee[];
  contracts: Contract[];
  leaveTypes: LeaveType[];
  leaveAllocations: LeaveAllocation[];
  leaveRequests: LeaveRequest[];
  attendances: AttendanceRecord[];
  salaryStructures: SalaryStructure[];
  salaryRules: SalaryRule[];
  payruns: Payrun[];
  payslips: Payslip[];
  payments: Payment[];
  auditLogs: AuditLog[];
}

const STORAGE_KEY = 'peoplepay360_db_v2';

export const INITIAL_MOCK_STATE: MockDatabaseState = {
  users: [
    { id: 'usr-1', name: 'Krish Admin', email: 'admin@peoplepay360.com', role: 'ADMIN', status: 'ACTIVE' },
    { id: 'usr-2', name: 'Priya Sharma', email: 'priya.sharma@peoplepay360.com', role: 'HR_MANAGER', status: 'ACTIVE' },
    { id: 'usr-3', name: 'Vikram Malhotra', email: 'vikram.malhotra@peoplepay360.com', role: 'HR_PAYROLL_MANAGER', status: 'ACTIVE' },
    { id: 'usr-4', name: 'Ananya Deshmukh', email: 'ananya.deshmukh@peoplepay360.com', role: 'HR_PAYROLL_USER', status: 'ACTIVE' },
    { id: 'usr-5', name: 'Rahul Sharma', email: 'rahul.sharma@peoplepay360.com', role: 'EMPLOYEE', status: 'ACTIVE', employeeId: 'emp-1' },
    { id: 'usr-6', name: 'Neha Shah', email: 'neha.shah@peoplepay360.com', role: 'EMPLOYEE', status: 'ACTIVE', employeeId: 'emp-2' },
  ],

  departments: [
    { id: 'dept-1', name: 'Engineering & Technology', code: 'ENG', isActive: true, employeeCount: 4, contractCount: 4 },
    { id: 'dept-2', name: 'Human Resources', code: 'HR', isActive: true, employeeCount: 2, contractCount: 2 },
    { id: 'dept-3', name: 'Finance & Accounts', code: 'FIN', isActive: true, employeeCount: 2, contractCount: 2 },
    { id: 'dept-4', name: 'Product & Design', code: 'PD', isActive: true, employeeCount: 2, contractCount: 2 },
    { id: 'dept-5', name: 'Sales & Marketing', code: 'SAL', isActive: true, employeeCount: 2, contractCount: 2 },
    { id: 'dept-6', name: 'Executive Leadership', code: 'EXEC', isActive: true, employeeCount: 1, contractCount: 1 },
  ],

  jobPositions: [
    { id: 'pos-1', title: 'Senior Full Stack Engineer', description: 'Leads full stack development', isActive: true, employeeCount: 2, contractCount: 2 },
    { id: 'pos-2', title: 'DevOps & Cloud Architect', description: 'Infrastructure and cloud pipelines', isActive: true, employeeCount: 1, contractCount: 1 },
    { id: 'pos-3', title: 'HR Operations Lead', description: 'People operations and onboarding', isActive: true, employeeCount: 2, contractCount: 2 },
    { id: 'pos-4', title: 'Financial Controller', description: 'Payroll and fiscal compliance', isActive: true, employeeCount: 2, contractCount: 2 },
    { id: 'pos-5', title: 'Principal UI/UX Designer', description: 'Product design and design system', isActive: true, employeeCount: 1, contractCount: 1 },
    { id: 'pos-6', title: 'Enterprise Account Executive', description: 'Sales and client expansion', isActive: true, employeeCount: 2, contractCount: 2 },
  ],

  workingSchedules: [
    {
      id: 'sched-1',
      name: 'Standard 40h (Mon-Fri 09:00 - 18:00)',
      scheduleType: 'FIXED',
      weeklyHours: 40,
      isActive: true,
      description: 'Standard 5-day work week with 1 hour lunch break (8h daily)',
      days: [
        { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00', breakHours: 1.0, isWorking: true },
        { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '18:00', breakHours: 1.0, isWorking: true },
        { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '18:00', breakHours: 1.0, isWorking: true },
        { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '18:00', breakHours: 1.0, isWorking: true },
        { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '18:00', breakHours: 1.0, isWorking: true },
        { dayOfWeek: 'SATURDAY', startTime: '00:00', endTime: '00:00', breakHours: 0, isWorking: false },
        { dayOfWeek: 'SUNDAY', startTime: '00:00', endTime: '00:00', breakHours: 0, isWorking: false },
      ],
    },
    {
      id: 'sched-2',
      name: 'Engineering Flexible 37.5h (Mon-Fri)',
      scheduleType: 'FLEXIBLE',
      weeklyHours: 37.5,
      isActive: true,
      description: 'Flexible engineering hours with core hours 10:30-16:30',
      days: [
        { dayOfWeek: 'MONDAY', startTime: '09:30', endTime: '18:00', breakHours: 1.0, isWorking: true },
        { dayOfWeek: 'TUESDAY', startTime: '09:30', endTime: '18:00', breakHours: 1.0, isWorking: true },
        { dayOfWeek: 'WEDNESDAY', startTime: '09:30', endTime: '18:00', breakHours: 1.0, isWorking: true },
        { dayOfWeek: 'THURSDAY', startTime: '09:30', endTime: '18:00', breakHours: 1.0, isWorking: true },
        { dayOfWeek: 'FRIDAY', startTime: '09:30', endTime: '18:00', breakHours: 1.0, isWorking: true },
        { dayOfWeek: 'SATURDAY', startTime: '00:00', endTime: '00:00', breakHours: 0, isWorking: false },
        { dayOfWeek: 'SUNDAY', startTime: '00:00', endTime: '00:00', breakHours: 0, isWorking: false },
      ],
    },
    {
      id: 'sched-3',
      name: 'Shift Operations 42h (Mon-Sat)',
      scheduleType: 'SHIFT',
      weeklyHours: 42,
      isActive: true,
      description: 'Support and operations shift schedule with 7h daily',
      days: [
        { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '16:00', breakHours: 1.0, isWorking: true },
        { dayOfWeek: 'TUESDAY', startTime: '08:00', endTime: '16:00', breakHours: 1.0, isWorking: true },
        { dayOfWeek: 'WEDNESDAY', startTime: '08:00', endTime: '16:00', breakHours: 1.0, isWorking: true },
        { dayOfWeek: 'THURSDAY', startTime: '08:00', endTime: '16:00', breakHours: 1.0, isWorking: true },
        { dayOfWeek: 'FRIDAY', startTime: '08:00', endTime: '16:00', breakHours: 1.0, isWorking: true },
        { dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '16:00', breakHours: 1.0, isWorking: true },
        { dayOfWeek: 'SUNDAY', startTime: '00:00', endTime: '00:00', breakHours: 0, isWorking: false },
      ],
    },
  ],

  employees: [
    {
      id: 'emp-1',
      employeeCode: 'EMP0001',
      name: 'Rahul Sharma',
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'rahul.sharma@peoplepay360.com',
      phone: '+91 98765 43210',
      departmentId: 'dept-1',
      positionId: 'pos-1',
      scheduleId: 'sched-1',
      hireDate: '2023-01-15',
      employmentStatus: 'ACTIVE',
      employeeType: 'FULL_TIME',
      bankAccountNumber: '5010043298124',
      bankName: 'HDFC Bank',
      bankAccountName: 'Rahul Sharma',
      ifscCode: 'HDFC0001234',
      panNumber: 'ABCPS1234D',
      uanNumber: '100902837465',
      emergencyContactName: 'Anjali Sharma',
      emergencyContactPhone: '+91 98765 00001',
      emergencyContactRelation: 'Spouse',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'emp-2',
      employeeCode: 'EMP0002',
      name: 'Neha Shah',
      firstName: 'Neha',
      lastName: 'Shah',
      email: 'neha.shah@peoplepay360.com',
      phone: '+91 98234 56789',
      departmentId: 'dept-1',
      positionId: 'pos-2',
      scheduleId: 'sched-2',
      hireDate: '2023-03-01',
      employmentStatus: 'ACTIVE',
      employeeType: 'FULL_TIME',
      bankAccountNumber: '9120100489372',
      bankName: 'ICICI Bank',
      bankAccountName: 'Neha Shah',
      ifscCode: 'ICIC0000104',
      panNumber: 'BNVPS5678E',
      uanNumber: '100902837466',
      emergencyContactName: 'Rajesh Shah',
      emergencyContactPhone: '+91 98234 00002',
      emergencyContactRelation: 'Father',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'emp-3',
      employeeCode: 'EMP0003',
      name: 'Amit Verma',
      firstName: 'Amit',
      lastName: 'Verma',
      email: 'amit.verma@peoplepay360.com',
      phone: '+91 99112 23344',
      departmentId: 'dept-2',
      positionId: 'pos-3',
      scheduleId: 'sched-1',
      hireDate: '2022-07-15',
      employmentStatus: 'ACTIVE',
      employeeType: 'FULL_TIME',
      bankAccountNumber: '30987654321',
      bankName: 'State Bank of India',
      bankAccountName: 'Amit Verma',
      ifscCode: 'SBIN0004567',
      panNumber: 'CPQPV9012F',
      uanNumber: '100902837467',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'emp-4',
      employeeCode: 'EMP0004',
      name: 'Vikram Singhania',
      firstName: 'Vikram',
      lastName: 'Singhania',
      email: 'vikram.singhania@peoplepay360.com',
      phone: '+91 98888 77777',
      departmentId: 'dept-3',
      positionId: 'pos-4',
      scheduleId: 'sched-1',
      hireDate: '2022-04-01',
      employmentStatus: 'ACTIVE',
      employeeType: 'FULL_TIME',
      bankAccountNumber: '60129384756',
      bankName: 'Axis Bank',
      bankAccountName: 'Vikram Singhania',
      ifscCode: 'UTIB0000892',
      panNumber: 'DPXPS3456G',
      uanNumber: '100902837468',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'emp-5',
      employeeCode: 'EMP0005',
      name: 'Priya Patel',
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.patel@peoplepay360.com',
      phone: '+91 97777 66666',
      departmentId: 'dept-5',
      positionId: 'pos-6',
      scheduleId: 'sched-3',
      hireDate: '2023-09-15',
      employmentStatus: 'ACTIVE',
      employeeType: 'FULL_TIME',
      bankAccountNumber: '40192837465',
      bankName: 'Kotak Mahindra Bank',
      bankAccountName: 'Priya Patel',
      ifscCode: 'KKBK0000543',
      panNumber: 'EPZPP7890H',
      uanNumber: '100902837469',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'emp-6',
      employeeCode: 'EMP0006',
      name: 'Rohan Mehra',
      firstName: 'Rohan',
      lastName: 'Mehra',
      email: 'rohan.mehra@peoplepay360.com',
      phone: '+91 96666 55555',
      departmentId: 'dept-4',
      positionId: 'pos-5',
      scheduleId: 'sched-2',
      hireDate: '2024-02-01',
      employmentStatus: 'ACTIVE',
      employeeType: 'FULL_TIME',
      bankAccountNumber: '10293847561',
      bankName: 'HDFC Bank',
      bankAccountName: 'Rohan Mehra',
      ifscCode: 'HDFC0001234',
      panNumber: 'FPAPM2345J',
      uanNumber: '100902837470',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
    },
  ],

  salaryStructures: [
    {
      id: 'struct-1',
      name: 'Standard Engineering CTC Structure',
      code: 'ENG_CTC',
      description: 'Base CTC structure for engineering & technical staff',
      type: 'MONTHLY',
      isActive: true,
      rules: [],
    },
    {
      id: 'struct-2',
      name: 'Management & Operations CTC Structure',
      code: 'MGMT_CTC',
      description: 'Executive structure with high allowance brackets',
      type: 'MONTHLY',
      isActive: true,
      rules: [],
    },
    {
      id: 'struct-3',
      name: 'Sales Incentive & Commission Structure',
      code: 'SALES_CTC',
      description: 'Sales structure with performance incentives',
      type: 'MONTHLY',
      isActive: true,
      rules: [],
    },
  ],

  salaryRules: [
    {
      id: 'rule-1',
      structureId: 'struct-1',
      name: 'Basic Salary',
      code: 'BASIC',
      category: 'BASIC',
      sequence: 1,
      type: 'PERCENTAGE',
      rate: 50.0,
      conditionType: 'ALWAYS_TRUE',
      isDeduction: false,
      isActive: true,
    },
    {
      id: 'rule-2',
      structureId: 'struct-1',
      name: 'House Rent Allowance (HRA)',
      code: 'HRA',
      category: 'ALLOWANCE',
      sequence: 2,
      type: 'PERCENTAGE',
      rate: 20.0,
      conditionType: 'ALWAYS_TRUE',
      isDeduction: false,
      isActive: true,
    },
    {
      id: 'rule-3',
      structureId: 'struct-1',
      name: 'Special Allowance',
      code: 'SPECIAL_ALLOWANCE',
      category: 'ALLOWANCE',
      sequence: 3,
      type: 'PERCENTAGE',
      rate: 30.0,
      conditionType: 'ALWAYS_TRUE',
      isDeduction: false,
      isActive: true,
    },
    {
      id: 'rule-4',
      structureId: 'struct-1',
      name: 'Gross CTC Total',
      code: 'GROSS',
      category: 'GROSS',
      sequence: 4,
      type: 'FORMULA',
      pythonCode: 'BASIC + HRA + SPECIAL_ALLOWANCE',
      conditionType: 'ALWAYS_TRUE',
      isDeduction: false,
      isActive: true,
    },
    {
      id: 'rule-5',
      structureId: 'struct-1',
      name: 'Provident Fund (PF Employee)',
      code: 'PF',
      category: 'DEDUCTION',
      sequence: 5,
      type: 'PERCENTAGE',
      rate: 12.0,
      conditionType: 'ALWAYS_TRUE',
      isDeduction: true,
      isActive: true,
    },
    {
      id: 'rule-6',
      structureId: 'struct-1',
      name: 'Professional Tax (PT)',
      code: 'PT',
      category: 'DEDUCTION',
      sequence: 6,
      type: 'FIXED',
      amount: 200.0,
      conditionType: 'ALWAYS_TRUE',
      isDeduction: true,
      isActive: true,
    },
    {
      id: 'rule-7',
      structureId: 'struct-1',
      name: 'Net Take-Home Pay',
      code: 'NET',
      category: 'NET',
      sequence: 7,
      type: 'FORMULA',
      pythonCode: 'GROSS - PF - PT - LOP',
      conditionType: 'ALWAYS_TRUE',
      isDeduction: false,
      isActive: true,
    },
  ],

  contracts: [
    {
      id: 'cnt-1',
      employeeId: 'emp-1',
      contractNumber: 'CNT-2026-001',
      wage: 40000.0,
      startDate: '2026-09-01',
      endDate: '2027-08-31',
      status: 'ACTIVE',
      salaryStructureId: 'struct-1',
      departmentId: 'dept-1',
      positionId: 'pos-1',
      scheduleId: 'sched-1',
    },
    {
      id: 'cnt-1-old',
      employeeId: 'emp-1',
      contractNumber: 'CNT-2025-001-PREV',
      wage: 30000.0,
      startDate: '2026-01-01',
      endDate: '2026-08-31',
      status: 'EXPIRED',
      salaryStructureId: 'struct-1',
      departmentId: 'dept-1',
      positionId: 'pos-1',
      scheduleId: 'sched-1',
    },
    {
      id: 'cnt-2',
      employeeId: 'emp-2',
      contractNumber: 'CNT-2023-002',
      wage: 105000.0,
      startDate: '2023-03-01',
      status: 'ACTIVE',
      salaryStructureId: 'struct-1',
      departmentId: 'dept-1',
      positionId: 'pos-2',
      scheduleId: 'sched-2',
    },
    {
      id: 'cnt-3',
      employeeId: 'emp-3',
      contractNumber: 'CNT-2022-003',
      wage: 95000.0,
      startDate: '2022-07-15',
      status: 'ACTIVE',
      salaryStructureId: 'struct-2',
      departmentId: 'dept-2',
      positionId: 'pos-3',
      scheduleId: 'sched-1',
    },
    {
      id: 'cnt-4',
      employeeId: 'emp-4',
      contractNumber: 'CNT-2022-004',
      wage: 125000.0,
      startDate: '2022-04-01',
      status: 'ACTIVE',
      salaryStructureId: 'struct-2',
      departmentId: 'dept-3',
      positionId: 'pos-4',
      scheduleId: 'sched-1',
    },
    {
      id: 'cnt-5',
      employeeId: 'emp-5',
      contractNumber: 'CNT-2023-005',
      wage: 85000.0,
      startDate: '2023-09-15',
      status: 'ACTIVE',
      salaryStructureId: 'struct-3',
      departmentId: 'dept-5',
      positionId: 'pos-6',
      scheduleId: 'sched-3',
    },
    {
      id: 'cnt-6',
      employeeId: 'emp-6',
      contractNumber: 'CNT-2024-006',
      wage: 110000.0,
      startDate: '2024-02-01',
      status: 'ACTIVE',
      salaryStructureId: 'struct-1',
      departmentId: 'dept-4',
      positionId: 'pos-5',
      scheduleId: 'sched-2',
    },
  ],

  leaveTypes: [
    { id: 'lt-1', name: 'Paid Privilege Leave (PL)', code: 'PL', unit: 'DAY', requiresAllocation: true, requiresApproval: true, payrollDeductible: false, maxConsecutiveUnits: 14, isActive: true },
    { id: 'lt-2', name: 'Sick & Medical Leave (SL)', code: 'SL', unit: 'DAY', requiresAllocation: true, requiresApproval: true, payrollDeductible: false, maxConsecutiveUnits: 7, isActive: true },
    { id: 'lt-3', name: 'Casual Leave (CL)', code: 'CL', unit: 'DAY', requiresAllocation: true, requiresApproval: true, payrollDeductible: false, maxConsecutiveUnits: 3, isActive: true },
    { id: 'lt-4', name: 'Compensatory Off (Comp-Off)', code: 'COMP', unit: 'DAY', requiresAllocation: false, requiresApproval: true, payrollDeductible: false, maxConsecutiveUnits: 2, isActive: true },
    { id: 'lt-5', name: 'Unpaid Leave of Absence (LOP)', code: 'UNPAID', unit: 'DAY', requiresAllocation: false, requiresApproval: true, payrollDeductible: true, isActive: true },
  ],

  leaveAllocations: [
    { id: 'alloc-1', employeeId: 'emp-1', leaveTypeId: 'lt-1', validFrom: '2026-01-01', validTo: '2026-12-31', allocatedUnits: 20, usedUnits: 3, remainingUnits: 17, status: 'APPROVED' },
    { id: 'alloc-2', employeeId: 'emp-1', leaveTypeId: 'lt-2', validFrom: '2026-01-01', validTo: '2026-12-31', allocatedUnits: 10, usedUnits: 0, remainingUnits: 10, status: 'APPROVED' },
    { id: 'alloc-3', employeeId: 'emp-2', leaveTypeId: 'lt-1', validFrom: '2026-01-01', validTo: '2026-12-31', allocatedUnits: 20, usedUnits: 1, remainingUnits: 19, status: 'APPROVED' },
    { id: 'alloc-4', employeeId: 'emp-3', leaveTypeId: 'lt-1', validFrom: '2026-01-01', validTo: '2026-12-31', allocatedUnits: 20, usedUnits: 0, remainingUnits: 20, status: 'APPROVED' },
    { id: 'alloc-5', employeeId: 'emp-4', leaveTypeId: 'lt-1', validFrom: '2026-01-01', validTo: '2026-12-31', allocatedUnits: 20, usedUnits: 2, remainingUnits: 18, status: 'APPROVED' },
  ],

  leaveRequests: [
    { id: 'lr-1', employeeId: 'emp-1', leaveTypeId: 'lt-1', startDate: '2026-09-10', endDate: '2026-09-12', requestedUnits: 3, reason: 'Annual Family Vacation', status: 'APPROVED' },
    { id: 'lr-2', employeeId: 'emp-2', leaveTypeId: 'lt-2', startDate: '2026-09-02', endDate: '2026-09-02', requestedUnits: 1, reason: 'Viral Fever & Medical Rest', status: 'APPROVED' },
    { id: 'lr-3', employeeId: 'emp-3', leaveTypeId: 'lt-3', startDate: '2026-09-18', endDate: '2026-09-19', requestedUnits: 2, reason: 'Personal Family Event', status: 'PENDING' },
    { id: 'lr-4', employeeId: 'emp-4', leaveTypeId: 'lt-1', startDate: '2026-09-25', endDate: '2026-09-26', requestedUnits: 2, reason: 'Conference & Technical Workshop', status: 'APPROVED' },
    { id: 'lr-5', employeeId: 'emp-5', leaveTypeId: 'lt-1', startDate: '2026-09-28', endDate: '2026-09-29', requestedUnits: 2, reason: 'Out of town wedding', status: 'PENDING' },
  ],

  attendances: [
    { id: 'att-1', employeeId: 'emp-1', attendanceDate: '2026-09-05', checkIn: '2026-09-05T09:05:00Z', checkOut: '2026-09-05T18:10:00Z', workedHours: 8.08, overtimeHours: 0.08, status: 'PRESENT' },
    { id: 'att-2', employeeId: 'emp-2', attendanceDate: '2026-09-05', checkIn: '2026-09-05T09:30:00Z', checkOut: '2026-09-05T18:00:00Z', workedHours: 7.5, overtimeHours: 0, status: 'PRESENT' },
    { id: 'att-3', employeeId: 'emp-3', attendanceDate: '2026-09-05', checkIn: '2026-09-05T09:10:00Z', checkOut: '2026-09-05T18:15:00Z', workedHours: 8.08, overtimeHours: 0.08, status: 'LATE' },
    { id: 'att-4', employeeId: 'emp-4', attendanceDate: '2026-09-05', checkIn: '2026-09-05T08:55:00Z', checkOut: '2026-09-05T18:05:00Z', workedHours: 8.16, overtimeHours: 0.16, status: 'PRESENT' },
    { id: 'att-5', employeeId: 'emp-5', attendanceDate: '2026-09-05', checkIn: '2026-09-05T08:00:00Z', checkOut: '2026-09-05T16:05:00Z', workedHours: 7.08, overtimeHours: 0.08, status: 'PRESENT' },
    { id: 'att-6', employeeId: 'emp-6', attendanceDate: '2026-09-05', checkIn: '2026-09-05T09:35:00Z', checkOut: '2026-09-05T18:00:00Z', workedHours: 7.41, overtimeHours: 0, status: 'PRESENT' },
  ],

  payruns: [
    {
      id: 'pr-aug-2026',
      name: 'August 2026 Regular Payroll',
      periodStartDate: '2026-08-01',
      periodEndDate: '2026-08-31',
      salaryStructureId: 'struct-1',
      status: 'PAID',
      totalGross: 550000.0,
      totalNet: 485000.0,
      totalDeductions: 65000.0,
      totalEmployerCost: 605000.0,
      payslipCount: 6,
      createdAt: '2026-08-28T10:00:00Z',
      validatedAt: '2026-08-30T14:00:00Z',
      paidAt: '2026-08-31T18:00:00Z',
    },
  ],

  payslips: [
    {
      id: 'ps-aug-emp1',
      payrunId: 'pr-aug-2026',
      employeeId: 'emp-1',
      contractId: 'cnt-1-old',
      salaryStructureId: 'struct-1',
      payslipNumber: 'PS-2026-08-001',
      periodStartDate: '2026-08-01',
      periodEndDate: '2026-08-31',
      status: 'PAID',
      basicSalary: 15000.0,
      grossSalary: 30000.0,
      totalDeductions: 2000.0,
      netSalary: 28000.0,
      workingDays: 22,
      paidDays: 22,
      lopDays: 0,
      lines: [
        { id: 'psl-1', payslipId: 'ps-aug-emp1', ruleCode: 'BASIC', ruleName: 'Basic Salary', category: 'BASIC', amount: 15000.0, sequence: 1, isDeduction: false },
        { id: 'psl-2', payslipId: 'ps-aug-emp1', ruleCode: 'HRA', ruleName: 'House Rent Allowance (HRA)', category: 'ALLOWANCE', amount: 6000.0, sequence: 2, isDeduction: false },
        { id: 'psl-3', payslipId: 'ps-aug-emp1', ruleCode: 'SPECIAL_ALLOWANCE', ruleName: 'Special Allowance', category: 'ALLOWANCE', amount: 9000.0, sequence: 3, isDeduction: false },
        { id: 'psl-4', payslipId: 'ps-aug-emp1', ruleCode: 'GROSS', ruleName: 'Gross CTC Total', category: 'GROSS', amount: 30000.0, sequence: 4, isDeduction: false },
        { id: 'psl-5', payslipId: 'ps-aug-emp1', ruleCode: 'PF', ruleName: 'Provident Fund (PF)', category: 'DEDUCTION', amount: 1800.0, sequence: 5, isDeduction: true },
        { id: 'psl-6', payslipId: 'ps-aug-emp1', ruleCode: 'PT', ruleName: 'Professional Tax (PT)', category: 'DEDUCTION', amount: 200.0, sequence: 6, isDeduction: true },
        { id: 'psl-7', payslipId: 'ps-aug-emp1', ruleCode: 'NET', ruleName: 'Net Take-Home Pay', category: 'NET', amount: 28000.0, sequence: 7, isDeduction: false },
      ],
    },
  ],

  payments: [
    {
      id: 'pay-aug-emp1',
      payslipId: 'ps-aug-emp1',
      employeeId: 'emp-1',
      amount: 28000.0,
      paymentDate: '2026-08-31',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'NEFT-HDFC-20260831-001',
      status: 'PAID',
    },
  ],

  auditLogs: [
    {
      id: 'log-1',
      timestamp: '2026-08-31T18:00:00Z',
      actorName: 'Vikram Malhotra',
      actorRole: 'HR_PAYROLL_MANAGER',
      action: 'PAYRUN_PAID',
      entityType: 'Payrun',
      entityId: 'pr-aug-2026',
      details: 'August 2026 Payroll finalized & marked as PAID.',
    },
  ],
};

class MockDatabase {
  private state: MockDatabaseState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): MockDatabaseState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.employees) && Array.isArray(parsed.salaryRules)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load mock DB from localStorage, falling back to initial state:', e);
    }
    return JSON.parse(JSON.stringify(INITIAL_MOCK_STATE));
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist mock DB state:', e);
    }
  }

  public getState(): MockDatabaseState {
    return this.state;
  }

  public updateState(updater: (draft: MockDatabaseState) => void): MockDatabaseState {
    updater(this.state);
    this.saveState();
    return this.state;
  }

  public resetToDefaults(): MockDatabaseState {
    this.state = JSON.parse(JSON.stringify(INITIAL_MOCK_STATE));
    this.saveState();
    return this.state;
  }

  public addAuditLog(actorName: string, actorRole: UserRole, action: string, entityType: string, entityId: string, details?: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action,
      entityType,
      entityId,
      details,
    };
    this.state.auditLogs.unshift(log);
    this.saveState();
  }
}

export const mockDB = new MockDatabase();
