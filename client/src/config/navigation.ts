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
    label: 'Attendance',
    path: '/attendance',
    icon: React.createElement(CalendarClock, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']
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
    icon: React.createElement(CalendarDays, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']
  },
  {
    label: 'User Management',
    path: '/users',
    icon: React.createElement(ShieldCheck, { className: "w-4 h-4" }),
    roles: ['ADMIN']
  },
];

export const sampleNavItems: NavItem[] = [];