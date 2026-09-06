import { api } from "./api";
import type { UserRole, ApiResponse } from "../types";

export interface AuthUserResponse {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: "ACTIVE" | "DISABLED";
  avatarUrl?: string | null;
  avatar_url?: string | null;
  avatar?: string | null;
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
  login: async (
    email: string,
    password: string,
  ): Promise<LoginResponseData> => {
    const res = await api.post<ApiResponse<LoginResponseData>>("/auth/login", {
      email,
      password,
    });
    return res.data;
  },

  googleAuth: async (idToken: string): Promise<LoginResponseData> => {
    const res = await api.post<ApiResponse<LoginResponseData>>("/auth/google", {
      idToken,
    });
    return res.data;
  },

  getCurrentUser: async (): Promise<AuthUserResponse> => {
    const res = await api.get<ApiResponse<AuthUserResponse>>("/auth/me");
    return res.data;
  },
};
