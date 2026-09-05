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

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
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

// Department Types (matches Backend Schema)
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

// Job Position Types (matches Backend Schema)
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

// Working Schedule Types (matches Backend Schema)
export type ScheduleType = 'FIXED' | 'FLEXIBLE';

export interface ScheduleDay {
  id?: string;
  dayOfWeek: number; // 1 (Mon) to 7 (Sun)
  startTime?: string | null; // e.g. "09:00"
  endTime?: string | null; // e.g. "18:00"
  breakMinutes: number;
  dayHours?: number;
}

export interface WorkingSchedule {
  id: string;
  name: string;
  scheduleType: ScheduleType;
  weeklyHours: number;
  isActive: boolean;
  employeeCount?: number;
  contractCount?: number;
  dayCount?: number;
  scheduleDays?: ScheduleDay[];
}

export interface CreateWorkingScheduleDTO {
  name: string;
  scheduleType?: ScheduleType;
  isActive?: boolean;
  scheduleDays: {
    dayOfWeek: number;
    startTime?: string | null;
    endTime?: string | null;
    breakMinutes: number;
  }[];
}

export interface UpdateWorkingScheduleDTO {
  name?: string;
  scheduleType?: ScheduleType;
  isActive?: boolean;
  scheduleDays?: {
    dayOfWeek: number;
    startTime?: string | null;
    endTime?: string | null;
    breakMinutes: number;
  }[];
}

export interface WorkingScheduleFilterParams {
  search?: string;
  isActive?: 'true' | 'false' | 'all';
  page?: number;
  limit?: number;
}

// Generic CRUD Types
export interface ExampleItem {
  id: string;
  name: string;
  category: string;
  status: 'Active' | 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  amount: number;
  updatedAt: string;
  description?: string;
  owner: string;
}

export interface APIFilters {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}

