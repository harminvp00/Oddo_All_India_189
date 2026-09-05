import type { NavItem } from '../types';
import React from 'react';
import { 
  LayoutDashboard, 
  Building2,
  Briefcase,
  CalendarDays,
} from 'lucide-react';

/**
 * Main Navigation Items
 * Displaying modules with backend implementations (Departments, Job Positions, Working Schedules).
 */
export const mainNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: React.createElement(LayoutDashboard, { className: "w-4 h-4" }),
  },
  {
    label: 'Departments',
    path: '/departments',
    icon: React.createElement(Building2, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER']
  },
  {
    label: 'Job Positions',
    path: '/positions',
    icon: React.createElement(Briefcase, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER']
  },
  {
    label: 'Working Schedules',
    path: '/schedules',
    icon: React.createElement(CalendarDays, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER']
  },
  /* 
  // --- UNIMPLEMENTED BACKEND MODULES (UNCOMMENT AS BACKEND GETS BUILT) ---
  {
    label: 'Employees',
    path: '/employees',
    icon: React.createElement(Users, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']
  },
  {
    label: 'My Profile',
    path: '/employees/me',
    icon: React.createElement(UserCircle, { className: "w-4 h-4" }),
    roles: ['EMPLOYEE']
  },
  {
    label: 'Contracts',
    path: '/contracts',
    icon: React.createElement(FileText, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']
  },
  {
    label: 'Schedules',
    path: '/schedules',
    icon: React.createElement(CalendarDays, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER']
  },
  {
    label: 'Attendance',
    path: '/attendance',
    icon: React.createElement(CalendarClock, { className: "w-4 h-4" }),
  },
  {
    label: 'Time Off',
    path: '/time-off',
    icon: React.createElement(CalendarDays, { className: "w-4 h-4" }),
  },
  {
    label: 'Payroll',
    path: '/payroll/payruns',
    icon: React.createElement(Calculator, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']
  },
  {
    label: 'Payslips',
    path: '/payslips',
    icon: React.createElement(FileSpreadsheet, { className: "w-4 h-4" }),
  },
  {
    label: 'Salary Structures',
    path: '/salary-structures',
    icon: React.createElement(Settings2, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_PAYROLL_MANAGER']
  },
  {
    label: 'Salary Rules',
    path: '/salary-rules',
    icon: React.createElement(Settings2, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_PAYROLL_MANAGER']
  },
  {
    label: 'Payments',
    path: '/payments',
    icon: React.createElement(Banknote, { className: "w-4 h-4" }),
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: React.createElement(PieChart, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: React.createElement(Settings2, { className: "w-4 h-4" }),
    roles: ['ADMIN']
  }
  */
];

export const sampleNavItems: NavItem[] = [];