import { mockDB } from './mockDatabase';
import type {
  UserAccount,
  UserStatus,
  CreateUserDTO,
  UpdateUserDTO,
  UserFilterParams,
  PaginationMeta,
} from '../types';

export const userService = {
  createUser: async (data: CreateUserDTO): Promise<UserAccount> => {
    const state = mockDB.getState();
    if (state.users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error(`User with email ${data.email} already exists.`);
    }

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    mockDB.updateState(draft => {
      draft.users.push({
        id: newUser.id,
        name: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      });
    });

    return newUser;
  },

  listUsers: async (
    params: UserFilterParams = {}
  ): Promise<{ items: UserAccount[]; meta: PaginationMeta }> => {
    const state = mockDB.getState();
    let result: UserAccount[] = state.users.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.name,
      role: u.role,
      status: u.status || 'ACTIVE',
      employeeId: u.employeeId,
      employee: u.employeeId ? {
        id: u.employeeId,
        employeeCode: state.employees.find(e => e.id === u.employeeId)?.employeeCode || '',
      } : null,
    }));

    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (params.role && params.role !== 'all') {
      result = result.filter(u => u.role === params.role);
    }
    if (params.status && params.status !== 'all') {
      result = result.filter(u => u.status === params.status);
    }

    const page = params.page || 1;
    const limit = params.limit || 50;
    const total = result.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;

    return {
      items: result.slice(startIndex, startIndex + limit),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  },

  getUsers: async (params?: UserFilterParams) => {
    const res = await userService.listUsers(params);
    return { users: res.items, data: res.items, meta: res.meta };
  },

  toggleUserStatus: async (id: string, nextStatus?: UserStatus): Promise<UserAccount> => {
    let updated: UserAccount | null = null;
    mockDB.updateState(draft => {
      const u = draft.users.find(item => item.id === id);
      if (u) {
        u.status = nextStatus || (u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE');
        updated = {
          id: u.id,
          email: u.email,
          fullName: u.name,
          role: u.role,
          status: u.status,
        };
      }
    });
    if (!updated) throw new Error('User not found');
    return updated;
  },

  updateUser: async (id: string, data: UpdateUserDTO): Promise<UserAccount> => {
    let updated: UserAccount | null = null;
    mockDB.updateState(draft => {
      const u = draft.users.find(item => item.id === id);
      if (u) {
        if (data.email) u.email = data.email;
        if (data.fullName) u.name = data.fullName;
        if (data.role) u.role = data.role;
        updated = {
          id: u.id,
          email: u.email,
          fullName: u.name,
          role: u.role,
          status: u.status || 'ACTIVE',
        };
      }
    });
    if (!updated) throw new Error('User not found');
    return updated;
  },

  deleteUser: async (id: string): Promise<void> => {
    mockDB.updateState(draft => {
      draft.users = draft.users.filter(u => u.id !== id);
    });
  },
};
