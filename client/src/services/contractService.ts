import { api } from './api';
import type {
  Contract,
  CreateContractDTO,
  UpdateContractDTO,
  ContractFilterParams,
  SalaryStructure,
  PaginationMeta,
  ApiResponse,
} from '../types';

export const contractService = {
  /**
   * List contracts with filtering, search, and pagination
   */
  listContracts: async (
    params: ContractFilterParams = {}
  ): Promise<{ items: Contract[]; meta: PaginationMeta }> => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.employeeId && params.employeeId !== 'all') query.append('employeeId', params.employeeId);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const endpoint = `/contracts${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await api.get<ApiResponse<Contract[]>>(endpoint);

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
   * Get single contract by ID
   */
  getContractById: async (id: string): Promise<Contract> => {
    const res = await api.get<ApiResponse<Contract>>(`/contracts/${id}`);
    return res.data;
  },

  /**
   * Create new contract (with server-side overlap prevention)
   */
  createContract: async (data: CreateContractDTO): Promise<Contract> => {
    const res = await api.post<ApiResponse<Contract>>('/contracts', data);
    return res.data;
  },

  /**
   * Update existing contract (re-validates active overlap)
   */
  updateContract: async (id: string, data: UpdateContractDTO): Promise<Contract> => {
    const res = await api.patch<ApiResponse<Contract>>(`/contracts/${id}`, data);
    return res.data;
  },

  /**
   * Delete or terminate contract
   */
  deleteContract: async (id: string): Promise<{ action: string; message: string }> => {
    const res = await api.delete<ApiResponse<{ action: string; message: string }>>(`/contracts/${id}`);
    return res.data;
  },

  /**
   * Fetch list of active salary structures for contract assignment
   */
  listSalaryStructures: async (): Promise<SalaryStructure[]> => {
    const res = await api.get<ApiResponse<SalaryStructure[]>>('/contracts/salary-structures');
    return res.data || [];
  },
};
