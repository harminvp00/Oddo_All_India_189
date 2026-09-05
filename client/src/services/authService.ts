import { mockDB } from './mockDatabase';
import type { UserRole } from '../types';

export interface AuthUserResponse {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: 'ACTIVE' | 'DISABLED';
  employeeId?: string | null;
  employee?: {
    id: string;
    employeeCode: string;
    departmentId?: string | null;
    positionId?: string | null;
  } | null;
}

export interface LoginResponseData {
  token: string;
  user: AuthUserResponse;
}

export const authService = {
  login: async (email: string, _password?: string): Promise<LoginResponseData> => {
    const state = mockDB.getState();
    const cleanEmail = email.trim().toLowerCase();
    let user = state.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Default fallback to Admin if unrecognized email
      user = state.users[0];
    }

    const authUser: AuthUserResponse = {
      id: user.id,
      email: user.email,
      fullName: user.name,
      role: user.role,
      status: user.status || 'ACTIVE',
      employeeId: user.employeeId,
      employee: user.employeeId ? {
        id: user.employeeId,
        employeeCode: state.employees.find(e => e.id === user.employeeId)?.employeeCode || '',
      } : null,
    };

    return {
      token: `mock_jwt_token_${user.id}_${Date.now()}`,
      user: authUser,
    };
  },

  googleAuth: async (idToken: string): Promise<LoginResponseData> => {
    // If idToken matches known email pattern or defaults to Rahul Sharma
    return authService.login(idToken.includes('@') ? idToken : 'admin@peoplepay360.com');
  },

  getCurrentUser: async (): Promise<AuthUserResponse> => {
    const saved = localStorage.getItem('peoplepay_user');
    if (saved) {
      const u = JSON.parse(saved);
      return {
        id: u.id,
        email: u.email,
        fullName: u.name,
        role: u.role,
        status: u.status || 'ACTIVE',
        employeeId: u.employeeId,
      };
    }
    const state = mockDB.getState();
    const admin = state.users[0];
    return {
      id: admin.id,
      email: admin.email,
      fullName: admin.name,
      role: admin.role,
      status: 'ACTIVE',
    };
  },
};
