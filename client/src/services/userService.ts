import { api } from './api';
import type {
  UserAccount,
  CreateUserDTO,
  UpdateUserDTO,
  UserFilterParams,
  PaginationMeta,
  ApiResponse,
} from '../types';

export const userService = {
  getUsers: async (
    params: UserFilterParams = {}
  ): Promise<{ users: UserAccount[]; meta: PaginationMeta }> => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role && params.role !== 'all') query.append('role', params.role);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const endpoint = `/users${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await api.get<ApiResponse<UserAccount[]>>(endpoint);

    return {
      users: res.data || [],
      meta: res.meta || {
        page: params.page || 1,
        limit: params.limit || 10,
        total: res.data?.length || 0,
        totalPages: 1,
      },
    };
  },

  getUserById: async (id: string): Promise<UserAccount> => {
    const res = await api.get<ApiResponse<UserAccount>>(`/users/${id}`);
    return res.data;
  },

  createUser: async (data: CreateUserDTO): Promise<UserAccount> => {
    const res = await api.post<ApiResponse<UserAccount>>('/users', data);
    return res.data;
  },

  updateUser: async (id: string, data: UpdateUserDTO): Promise<UserAccount> => {
    const res = await api.patch<ApiResponse<UserAccount>>(`/users/${id}`, data);
    return res.data;
  },

  toggleUserStatus: async (id: string, status: 'ACTIVE' | 'DISABLED'): Promise<UserAccount> => {
    const res = await api.patch<ApiResponse<UserAccount>>(`/users/${id}/status`, { status });
    return res.data;
  },
};
