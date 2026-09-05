import { api } from './api';
import type {
  Employee,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  EmployeeFilterParams,
  PaginationMeta,
  ApiResponse,
} from '../types';

export const employeeService = {
  /**
   * Create a new employee with database sync
   */
  createEmployee: async (data: CreateEmployeeDTO): Promise<Employee> => {
    const res = await api.post<ApiResponse<Employee>>('/employees', data);
    return res.data;
  },

  /**
   * List employees with filtering, searching, and pagination
   */
  listEmployees: async (
    params: EmployeeFilterParams = {}
  ): Promise<{ items: Employee[]; meta: PaginationMeta }> => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.departmentId && params.departmentId !== 'all') query.append('departmentId', params.departmentId);
    if (params.positionId && params.positionId !== 'all') query.append('positionId', params.positionId);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const endpoint = `/employees${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await api.get<ApiResponse<Employee[]>>(endpoint);

    return {
      items: res.data || [],
      meta: res.meta || {
        page: params.page || 1,
        limit: params.limit || 20,
        total: res.data?.length || 0,
        totalPages: 1,
      },
    };
  },

  /**
   * Get employee details by ID
   */
  getEmployeeById: async (id: string): Promise<Employee> => {
    const res = await api.get<ApiResponse<Employee>>(`/employees/${id}`);
    return res.data;
  },

  /**
   * Update employee profile
   */
  updateEmployee: async (id: string, data: UpdateEmployeeDTO): Promise<Employee> => {
    const res = await api.patch<ApiResponse<Employee>>(`/employees/${id}`, data);
    return res.data;
  },

  /**
   * Archive / delete employee
   */
  deleteEmployee: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
  },
};
