import type { ReactNode } from 'react';

// Navigation & Layout Types
export interface NavItem {
  label: string;
  path: string;
  icon?: ReactNode;
  badge?: string | number;
}

// User & Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'manager';
  avatar?: string;
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
  key: string;
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

// Demonstration Generic CRUD Types
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
