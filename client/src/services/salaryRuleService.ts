import { api } from './api';
import type { ApiResponse } from '../types';

export interface BackendSalaryRule {
  id: string;
  name: string;
  code: string;
  category: 'BASIC' | 'ALLOWANCE' | 'GROSS' | 'DEDUCTION' | 'CONTRIBUTION' | 'NET';
  method: 'FIXED' | 'PERCENTAGE' | 'FORMULA';
  fixed_amount?: number | null;
  percentage?: number | null;
  formula?: string | null;
  is_active?: boolean;
}

export interface UpdateSalaryRuleDTO {
  name?: string;
  code?: string;
  category?: 'BASIC' | 'ALLOWANCE' | 'GROSS' | 'DEDUCTION' | 'CONTRIBUTION' | 'NET';
  method?: 'FIXED' | 'PERCENTAGE' | 'FORMULA';
  fixedAmount?: number | null;
  percentage?: number | null;
  formula?: string | null;
  isActive?: boolean;
}

export const salaryRuleService = {
  /**
   * List all salary computation rules
   */
  async listRules(params?: { search?: string; category?: string; isActive?: boolean }): Promise<ApiResponse<BackendSalaryRule[]>> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
    const qs = query.toString();
    return api.get<ApiResponse<BackendSalaryRule[]>>(`/salary-rules${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get single salary rule by ID
   */
  async getRule(id: string): Promise<ApiResponse<BackendSalaryRule>> {
    return api.get<ApiResponse<BackendSalaryRule>>(`/salary-rules/${id}`);
  },

  /**
   * Create a new salary rule
   */
  async createRule(data: UpdateSalaryRuleDTO): Promise<ApiResponse<BackendSalaryRule>> {
    return api.post<ApiResponse<BackendSalaryRule>>('/salary-rules', data);
  },

  /**
   * Update an existing salary rule (Proper Edit API)
   */
  async updateRule(id: string, data: UpdateSalaryRuleDTO): Promise<ApiResponse<BackendSalaryRule>> {
    return api.patch<ApiResponse<BackendSalaryRule>>(`/salary-rules/${id}`, data);
  },

  /**
   * Delete a salary rule
   */
  async deleteRule(id: string): Promise<ApiResponse<any>> {
    return api.delete<ApiResponse<any>>(`/salary-rules/${id}`);
  },
};
