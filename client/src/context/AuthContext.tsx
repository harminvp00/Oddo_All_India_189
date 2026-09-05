import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, UserRole } from "../types";
import { SplashScreen } from "../components/ui/SplashScreen";
import { authService, type AuthUserResponse } from "../services/authService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  initializing: boolean;
  login: (email: string, password?: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { getStoredAvatar } from "../utils/avatarUtils";

function mapAuthUser(apiUser: any): User {
  const avatar =
    apiUser.avatarUrl ||
    apiUser.avatar_url ||
    apiUser.avatar ||
    (apiUser.email ? getStoredAvatar(apiUser.email) : null) ||
    (apiUser.employeeId ? getStoredAvatar(apiUser.employeeId) : null) ||
    (apiUser.employee?.employeeCode ? getStoredAvatar(apiUser.employee.employeeCode) : null) ||
    undefined;

  return {
    id: apiUser.id?.toString?.() || String(apiUser.id),
    name: apiUser.fullName || apiUser.full_name || apiUser.name || apiUser.email?.split("@")[0] || "User",
    email: apiUser.email,
    role: (apiUser.role as UserRole) || "EMPLOYEE",
    status: apiUser.status,
    avatar: avatar || undefined,
    employeeId:
      apiUser.employeeId ||
      apiUser.employee_id ||
      (apiUser.employee ? (apiUser.employee.id?.toString?.() || apiUser.employee.id) : null),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Initial application setup & token / session restoration
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("peoplepay_user");

      if (token) {
        try {
          // Verify with live backend API
          const profile = await authService.getCurrentUser();
          const mapped = mapAuthUser(profile);
          setUser(mapped);
          localStorage.setItem("peoplepay_user", JSON.stringify(mapped));
        } catch (error) {
          // Token invalid or user disabled -> clear stale session
          localStorage.removeItem("token");
          localStorage.removeItem("peoplepay_user");
          setUser(null);
        }
      } else if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      }

      setInitializing(false);
    };

    restoreSession();
  }, []);

  const login = async (email: string, password = "Password123!") => {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      localStorage.setItem("token", response.token);
      const mapped = mapAuthUser(response.user);
      setUser(mapped);
      localStorage.setItem("peoplepay_user", JSON.stringify(mapped));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (idToken: string) => {
    setLoading(true);
    try {
      const response = await authService.googleAuth(idToken);
      localStorage.setItem("token", response.token);
      const mapped = mapAuthUser(response.user);
      setUser(mapped);
      localStorage.setItem("peoplepay_user", JSON.stringify(mapped));
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await authService.getCurrentUser();
      const mapped = mapAuthUser(profile);
      setUser(mapped);
      localStorage.setItem("peoplepay_user", JSON.stringify(mapped));
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string) => {
    setLoading(true);
    try {
      // Placeholder or fallback registration hook
      await new Promise((res) => setTimeout(res, 500));
      setUser({
        id: `usr_${Date.now()}`,
        name,
        email,
        role: "EMPLOYEE",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("peoplepay_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        initializing,
        login,
        googleLogin,
        logout,
        register,
        refreshProfile,
      }}
    >
      {initializing ? (
        <SplashScreen message="Preparing PeoplePay 360..." />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
