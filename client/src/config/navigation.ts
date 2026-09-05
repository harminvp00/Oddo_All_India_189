import type { NavItem } from '../types';
import React from 'react';
import { 
  LayoutDashboard, 
  Users,
  UserCircle,
  Building2,
  Briefcase,
  CalendarDays,
  Settings2,
  Shield,
  FileText,
  CalendarClock,
  Calculator,
  FileSpreadsheet,
  Banknote,
  PieChart
} from 'lucide-react';

/**
 * Main Navigation Items for PeoplePay 360
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
    roles: ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'],
  },
  {
    label: 'My Profile',
    path: '/employees/me',
    icon: React.createElement(UserCircle, { className: "w-4 h-4" }),
    roles: ['EMPLOYEE'],
  },
  {
    label: 'Departments',
    path: '/departments',
    icon: React.createElement(Building2, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER'],
  },
  {
    label: 'Job Positions',
    path: '/positions',
    icon: React.createElement(Briefcase, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER'],
  },
  {
    label: 'Working Schedules',
    path: '/schedules',
    icon: React.createElement(CalendarDays, { className: "w-4 h-4" }),
    roles: ['ADMIN', 'HR_MANAGER'],
  },
  {
    label: 'User Management',
    path: '/users',
    icon: React.createElement(Shield, { className: "w-4 h-4" }),
    roles: ['ADMIN'],
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: React.createElement(Settings2, { className: "w-4 h-4" }),
    roles: ['ADMIN'],
  },
];

export const sampleNavItems: NavItem[] = [];