
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { SplashScreen } from '../components/ui/SplashScreen';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  initializing: boolean;
  login: (email: string, role?: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string) => Promise<void>;
}

const DEFAULT_USER: User = {
  id: 'usr_1',
  name: 'Rahul Sharma',
  email: 'admin@peoplepay360.com',
  role: 'ADMIN',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Initial application setup & token / session restoration
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem('hackathon_user');
      if (!localStorage.getItem('token')) {
        localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6ImFkbWluQHBlb3BsZXBheTM2MC5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3ODg1OTkwMjAsImV4cCI6MTc5MTE5MTAyMH0.k9jTZyarOa-it_B_JaoKTNudW617EpqYrXqj_rUrh7g');
      }
      setUser(saved ? JSON.parse(saved) : DEFAULT_USER);
      setInitializing(false);
    }, 300); // Fast 300ms splash screen initialization

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!initializing) {
      if (user) {
        localStorage.setItem('hackathon_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('hackathon_user');
      }
    }
  }, [user, initializing]);

  const login = async (email: string, role?: string) => {
    setLoading(true);
    await new Promise((res) => setTimeout(res, 500));
    setUser({
      id: `usr_${Math.random().toString(36).substr(2, 6)}`,
      name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      email,
      role: (role as any) || 'ADMIN',
    });
    setLoading(false);
  };

  const register = async (name: string, email: string) => {
    setLoading(true);
    await new Promise((res) => setTimeout(res, 500));
    setUser({
      id: `usr_${Math.random().toString(36).substr(2, 6)}`,
      name,
      email,
      role: 'EMPLOYEE',
    });
    setLoading(false);
  };

  const logout = () => {
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
        logout,
        register,
      }}
    >
      {initializing ? <SplashScreen message="Preparing hackathon workspace..." /> : children}
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
