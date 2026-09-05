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

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: React.createElement(LayoutDashboard, { className: "w-4 h-4" }),
      },
    ],
  },
  {
    title: 'PEOPLE',
    items: [
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
    ],
  },
  {
    title: 'TIME',
    items: [
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
    ],
  },
  {
    title: 'PAYROLL',
    items: [
      {
        label: 'Payruns',
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
        label: 'Payments',
        path: '/payments',
        icon: React.createElement(CreditCard, { className: "w-4 h-4" }),
        roles: ['ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER']
      },
    ],
  },
  {
    title: 'INSIGHTS',
    items: [
      {
        label: 'Reports & Analytics',
        path: '/reports',
        icon: React.createElement(BarChart3, { className: "w-4 h-4" }),
        roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER']
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      {
        label: 'Settings',
        path: '/settings',
        icon: React.createElement(ShieldCheck, { className: "w-4 h-4" }),
        roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'EMPLOYEE']
      },
      {
        label: 'User Management',
        path: '/users',
        icon: React.createElement(ShieldCheck, { className: "w-4 h-4" }),
        roles: ['ADMIN']
      },
    ],
  },
];

export const mainNavItems: NavItem[] = navGroups.flatMap(g => g.items);
export const sampleNavItems: NavItem[] = [];