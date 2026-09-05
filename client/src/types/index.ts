import type { ReactNode } from 'react';

// Navigation & Layout Types
export interface NavItem {
  label: string;
  path: string;
  icon?: ReactNode;
  badge?: string | number;
  roles?: UserRole[];
}

// User & Auth Types
export type UserRole = 'ADMIN' | 'HR_MANAGER' | 'HR_PAYROLL_USER' | 'HR_PAYROLL_MANAGER' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  avatar?: string;
  employeeId?: string | null;
}

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  lastLoginAt?: string | null;
  employeeId?: string | null;
  employeeCode?: string | null;
  employee?: {
    id: string;
    employeeCode: string;
    departmentId?: string | null;
    positionId?: string | null;
  } | null;
}

export interface CreateUserDTO {
  email: string;
  fullName: string;
  role: UserRole;
  password?: string;
}

export interface UpdateUserDTO {
  email?: string;
  fullName?: string;
  role?: UserRole;
}

export interface UserFilterParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// UI Variant Types
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' | 'teal';
export type AlertVariant = 'success' | 'warning' | 'danger' | 'info';

// Table Component Types
export interface TableColumn<T> {
  key?: string;
  accessor?: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Department Types
export interface Department {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  employeeCount?: number;
  contractCount?: number;
}

export interface CreateDepartmentDTO {
  name: string;
  code: string;
  isActive?: boolean;
}

export interface UpdateDepartmentDTO {
  name?: string;
  code?: string;
  isActive?: boolean;
}

export interface DepartmentFilterParams {
  search?: string;
  isActive?: 'true' | 'false' | 'all';
  page?: number;
  limit?: number;
}

// Job Position Types
export interface JobPosition {
  id: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  employeeCount?: number;
  contractCount?: number;
}

export interface CreateJobPositionDTO {
  title: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateJobPositionDTO {
  title?: string;
  description?: string;
  isActive?: boolean;
}

export interface JobPositionFilterParams {
  search?: string;
  isActive?: 'true' | 'false' | 'all';
  page?: number;
  limit?: number;
}

// Working Schedule Types
export type ScheduleType = 'FIXED' | 'FLEXIBLE' | 'SHIFT';

export interface ScheduleDay {
  id?: string;
  dayOfWeek: number | string;
  startTime?: string | null;
  endTime?: string | null;
  breakMinutes?: number;
  breakHours?: number;
  dayHours?: number;
  isWorking?: boolean;
}

export interface WorkingSchedule {
  id: string;
  name: string;
  scheduleType: ScheduleType;
  weeklyHours: number;
  isActive: boolean;
  description?: string;
  employeeCount?: number;
  contractCount?: number;
  dayCount?: number;
  scheduleDays?: ScheduleDay[];
  days?: ScheduleDay[];
}

export interface CreateWorkingScheduleDTO {
  name: string;
  scheduleType?: ScheduleType;
  isActive?: boolean;
  description?: string;
  scheduleDays?: {
    dayOfWeek: number | string;
    startTime?: string | null;
    endTime?: string | null;
    breakMinutes?: number;
    breakHours?: number;
    isWorking?: boolean;
  }[];
  days?: ScheduleDay[];
}

export interface UpdateWorkingScheduleDTO {
  name?: string;
  scheduleType?: ScheduleType;
  isActive?: boolean;
  description?: string;
  scheduleDays?: {
    dayOfWeek: number | string;
    startTime?: string | null;
    endTime?: string | null;
    breakMinutes?: number;
    breakHours?: number;
    isWorking?: boolean;
  }[];
  days?: ScheduleDay[];
}

export interface WorkingScheduleFilterParams {
  search?: string;
  scheduleType?: string;
  isActive?: 'true' | 'false' | 'all';
  page?: number;
  limit?: number;
}

// Attendance Types
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'HALF_DAY' | 'CORRECTED' | 'OVERTIME' | 'ON_LEAVE';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  attendanceDate: string;
  checkIn?: string | null;
  checkOut?: string | null;
  workedHours: number;
  overtimeHours: number;
  status: AttendanceStatus;
  correctionNote?: string | null;
  correctedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  };
}

export interface CheckInDTO {
  employeeId?: string;
  attendanceDate?: string;
  checkIn?: string;
}

export interface CheckOutDTO {
  employeeId?: string;
  attendanceDate?: string;
  checkOut?: string;
}

export interface CorrectionDTO {
  checkIn?: string;
  checkOut?: string;
  workedHours?: number;
  status?: AttendanceStatus;
  correctionNote: string;
}

export interface AttendanceFilterParams {
  search?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// Employee Types
export type EmployeeType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'TEMPORARY';
export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  hireDate: string;
  terminationDate?: string | null;
  employeeType: EmployeeType;
  employmentStatus: EmploymentStatus;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  positionId?: string | null;
  position?: {
    id: string;
    title: string;
  };
  scheduleId?: string | null;
  schedule?: {
    id: string;
    name: string;
    scheduleType: string;
    weeklyHours: number;
  };
  managerId?: string | null;
  manager?: {
    id: string;
    employeeCode: string;
    name: string;
  };
  userId?: string | null;
  user?: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  ifscCode?: string | null;
  panNumber?: string | null;
  uanNumber?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  totalAttendance?: number;
  totalContracts?: number;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeDTO {
  employeeCode?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  hireDate: string;
  employeeType?: EmployeeType;
  employmentStatus?: EmploymentStatus;
  departmentId?: string;
  positionId?: string;
  managerId?: string;
  scheduleId?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  panNumber?: string;
  uanNumber?: string;
  avatarUrl?: string | null;
}

export interface UpdateEmployeeDTO {
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  hireDate?: string;
  terminationDate?: string;
  employeeType?: EmployeeType;
  employmentStatus?: EmploymentStatus;
  departmentId?: string;
  positionId?: string;
  managerId?: string;
  scheduleId?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  panNumber?: string;
  uanNumber?: string;
  avatarUrl?: string | null;
}

export interface EmployeeFilterParams {
  search?: string;
  departmentId?: string;
  positionId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// Contract & Salary Structure Types
export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';

export interface SalaryStructure {
  id: string;
  name: string;
  code?: string;
  type?: string;
  description?: string | null;
  isActive?: boolean;
  rules?: SalaryRule[];
}

export interface Contract {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    employeeCode: string;
    name?: string;
    fullName?: string;
  } | null;
  contractNumber: string;
  startDate: string;
  endDate?: string | null;
  status: ContractStatus;
  wage: number;
  currencyCode?: string;
  salaryStructureId: string;
  salaryStructure?: {
    id: string;
    name: string;
  } | null;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  positionId?: string | null;
  position?: {
    id: string;
    title: string;
  } | null;
  scheduleId?: string | null;
  schedule?: {
    id: string;
    name: string;
    weeklyHours: number;
  } | null;
  workingSchedule?: {
    id: string;
    name: string;
    weeklyHours: number;
  } | null;
  payslipCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateContractDTO {
  employeeId: string;
  contractNumber?: string;
  startDate: string;
  endDate?: string | null;
  wage: number;
  currencyCode?: string;
  salaryStructureId: string;
  departmentId?: string | null;
  positionId?: string | null;
  scheduleId?: string | null;
  status?: ContractStatus;
}

export interface UpdateContractDTO {
  contractNumber?: string;
  startDate?: string;
  endDate?: string | null;
  wage?: number;
  currencyCode?: string;
  salaryStructureId?: string;
  departmentId?: string | null;
  positionId?: string | null;
  scheduleId?: string | null;
  status?: ContractStatus;
}

export interface ContractFilterParams {
  employeeId?: string;
  status?: ContractStatus | 'ALL' | string;
  salaryStructureId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Salary Rules, Payruns, Payslips, and Payments Types
export type SalaryRuleCategory = 'BASIC' | 'ALLOWANCE' | 'GROSS' | 'DEDUCTION' | 'NET';
export type SalaryRuleType = 'FIXED' | 'PERCENTAGE' | 'FORMULA';

export interface SalaryRule {
  id: string;
  structureId?: string;
  name: string;
  code: string;
  category: SalaryRuleCategory;
  sequence: number;
  type: SalaryRuleType;
  amount?: number;
  rate?: number;
  pythonCode?: string;
  conditionType?: string;
  isDeduction?: boolean;
  isActive: boolean;
}

export type PayrunStatus = 'DRAFT' | 'COMPUTED' | 'VALIDATED' | 'PAID' | 'COMPLETED';

export interface Payrun {
  id: string;
  name: string;
  periodStartDate: string;
  periodEndDate: string;
  salaryStructureId: string;
  status: PayrunStatus;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalEmployerCost: number;
  payslipCount: number;
  createdAt?: string;
  validatedAt?: string;
  paidAt?: string;
}

export interface PayslipLine {
  id: string;
  payslipId: string;
  ruleCode: string;
  ruleName: string;
  category: SalaryRuleCategory;
  amount: number;
  sequence: number;
  isDeduction: boolean;
}

export interface Payslip {
  id: string;
  payrunId: string;
  employeeId: string;
  contractId: string;
  salaryStructureId: string;
  payslipNumber: string;
  periodStartDate: string;
  periodEndDate: string;
  status: 'DRAFT' | 'VALIDATED' | 'PAID' | 'CANCELLED';
  basicSalary: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  workingDays: number;
  paidDays: number;
  lopDays: number;
  lines: PayslipLine[];
  employee?: Employee;
  contract?: Contract;
}

export interface Payment {
  id: string;
  payslipId: string;
  employeeId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  employee?: Employee;
}

// Employee 360° Hub Summary Types
export interface EmployeeSummary {
  employee: {
    id: string;
    employeeCode: string;
    name: string;
    email?: string | null;
    departmentName?: string;
    positionTitle?: string;
  };
  counts: {
    contracts: number;
    attendanceDays: number;
    timeOffRequests?: number;
    approvedLeaves: number;
    remainingLeaveDays: number;
    payslips: number;
    payments?: number;
  };
  activeContract: {
    id: string;
    contractNumber: string;
    wage: number;
    startDate?: string;
    endDate?: string | null;
    salaryStructureName: string;
  } | null;
}

// Time Off / Leave Management Types
export type LeaveUnit = 'DAY' | 'HOUR';
export type AllocationStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  unit: LeaveUnit;
  requiresAllocation: boolean;
  requiresApproval: boolean;
  payrollDeductible: boolean;
  maxConsecutiveUnits?: number | null;
  isActive: boolean;
}

export interface CreateLeaveTypeDTO {
  name: string;
  code: string;
  unit?: LeaveUnit;
  requiresAllocation?: boolean;
  requiresApproval?: boolean;
  payrollDeductible?: boolean;
  maxConsecutiveUnits?: number | null;
  isActive?: boolean;
}

export interface LeaveAllocation {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    name: string;
    employeeCode: string;
  } | null;
  leaveTypeId: string;
  leaveType?: {
    id: string;
    name: string;
    code: string;
    unit: LeaveUnit;
  } | null;
  validFrom: string;
  validTo: string;
  allocatedUnits: number;
  usedUnits: number;
  remainingUnits?: number;
  status: AllocationStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

export interface CreateAllocationDTO {
  employeeId: string;
  leaveTypeId: string;
  validFrom: string;
  validTo: string;
  allocatedUnits: number;
  status?: AllocationStatus;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    name: string;
    employeeCode: string;
  } | null;
  leaveTypeId: string;
  leaveType?: {
    id: string;
    name: string;
    code: string;
    unit: LeaveUnit;
  } | null;
  allocationId?: string | null;
  startDate: string;
  endDate: string;
  requestedUnits: number;
  reason?: string | null;
  status: LeaveRequestStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt?: string;
}

export interface CreateLeaveRequestDTO {
  employeeId?: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  requestedUnits: number;
  reason?: string;
}
