import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { SplashScreen } from '../components/ui/SplashScreen';
import { authService, type AuthUserResponse } from '../services/authService';
import { mockDB } from '../services/mockDatabase';

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
  switchPersona: (role: UserRole) => void;
  resetDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapAuthUser(apiUser: AuthUserResponse): User {
  return {
    id: apiUser.id,
    name: apiUser.fullName || apiUser.email.split('@')[0],
    email: apiUser.email,
    role: apiUser.role as UserRole,
    status: apiUser.status,
    employeeId: apiUser.employeeId || (apiUser.employee ? apiUser.employee.id : null),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Initial application setup & session restoration
  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = localStorage.getItem('peoplepay_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      } else {
        // Default login as Admin for instantaneous seamless onboarding
        const defaultAdmin: User = {
          id: 'usr-1',
          name: 'Krish Admin',
          email: 'admin@peoplepay360.com',
          role: 'ADMIN',
          status: 'ACTIVE',
        };
        setUser(defaultAdmin);
        localStorage.setItem('peoplepay_user', JSON.stringify(defaultAdmin));
      }
      setInitializing(false);
    };

    restoreSession();
  }, []);

  const login = async (email: string, password = 'Password123!') => {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.token);
      const mapped = mapAuthUser(response.user);
      setUser(mapped);
      localStorage.setItem('peoplepay_user', JSON.stringify(mapped));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (idToken: string) => {
    setLoading(true);
    try {
      const response = await authService.googleAuth(idToken);
      localStorage.setItem('token', response.token);
      const mapped = mapAuthUser(response.user);
      setUser(mapped);
      localStorage.setItem('peoplepay_user', JSON.stringify(mapped));
    } finally {
      setLoading(false);
    }
  };

  const switchPersona = (role: UserRole) => {
    const state = mockDB.getState();
    const targetUser = state.users.find(u => u.role === role) || state.users[0];
    const mapped: User = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      status: targetUser.status || 'ACTIVE',
      employeeId: targetUser.employeeId,
    };
    setUser(mapped);
    localStorage.setItem('peoplepay_user', JSON.stringify(mapped));
  };

  const resetDemoData = () => {
    mockDB.resetToDefaults();
    window.location.reload();
  };

  const refreshProfile = async () => {
    try {
      const profile = await authService.getCurrentUser();
      const mapped = mapAuthUser(profile);
      setUser(mapped);
      localStorage.setItem('peoplepay_user', JSON.stringify(mapped));
    } catch {
      // Ignore refresh error
    }
  };

  const register = async (name: string, email: string) => {
    setLoading(true);
    try {
      const newUser: User = {
        id: `usr_${Date.now()}`,
        name,
        email,
        role: 'EMPLOYEE',
      };
      setUser(newUser);
      localStorage.setItem('peoplepay_user', JSON.stringify(newUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('peoplepay_user');
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
        switchPersona,
        resetDemoData,
      }}
    >
      {initializing ? <SplashScreen message="Preparing PeoplePay 360..." /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
