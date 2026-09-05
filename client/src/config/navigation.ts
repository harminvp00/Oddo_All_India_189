import type { NavItem } from '../types';
import React from 'react';
import { 
  LayoutDashboard, 
  Building2,
  Briefcase,
  CalendarDays,
  CalendarClock,
  Users,
  ShieldCheck,
  FileText,
  CreditCard,
  Receipt,
  Layers,
  Sliders,
  BarChart3,
  Clock,
} from 'lucide-react';

/**
 * Main Navigation Items
 * Role-based navigation with full support for Admin, HR, Payroll, and Employee roles.
 */
export const mainNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: React.createElement(LayoutDashboard, { className: "w-4 h-4" }),
  },
  {
    label: 'Employees',
    path: '/employees',
    icon: React.createElement(Users, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']
  },
  {
    label: 'Contracts',
    path: '/contracts',
    icon: React.createElement(FileText, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']
  },
  {
    label: 'Attendance',
    path: '/attendance',
    icon: React.createElement(CalendarClock, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']
  },
  {
    label: 'Time Off',
    path: '/time-off',
    icon: React.createElement(CalendarDays, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']
  },
  {
    label: 'Payruns & Payroll',
    path: '/payroll/payruns',
    icon: React.createElement(CreditCard, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']
  },
  {
    label: 'Payslips',
    path: '/payslips',
    icon: React.createElement(Receipt, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']
  },
  {
    label: 'Salary Structures',
    path: '/salary-structures',
    icon: React.createElement(Layers, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']
  },
  {
    label: 'Salary Rules',
    path: '/salary-rules',
    icon: React.createElement(Sliders, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']
  },
  {
    label: 'Departments',
    path: '/departments',
    icon: React.createElement(Building2, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']
  },
  {
    label: 'Job Positions',
    path: '/positions',
    icon: React.createElement(Briefcase, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']
  },
  {
    label: 'Working Schedules',
    path: '/schedules',
    icon: React.createElement(Clock, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']
  },
  {
    label: 'Reports & Analytics',
    path: '/reports',
    icon: React.createElement(BarChart3, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']
  },
  {
    label: 'User Management',
    path: '/users',
    icon: React.createElement(ShieldCheck, { className: "w-4 h-4" }),
    roles: ['ADMIN']
  },
];

export const sampleNavItems: NavItem[] = [];