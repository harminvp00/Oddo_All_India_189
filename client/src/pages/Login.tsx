import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, UserCircle } from 'lucide-react';
import type { UserRole } from '../types';

const DEMO_ACCOUNTS = [
  { role: 'ADMIN', email: 'admin@peoplepay360.com', label: 'Admin' },
  { role: 'HR_MANAGER', email: 'hrmanager@peoplepay360.com', label: 'HR Manager' },
  { role: 'HR_PAYROLL_USER', email: 'payrolluser@peoplepay360.com', label: 'HR Payroll User' },
  { role: 'HR_PAYROLL_MANAGER', email: 'payrollmanager@peoplepay360.com', label: 'HR Payroll Manager' },
  { role: 'EMPLOYEE', email: 'employee@peoplepay360.com', label: 'Employee' },
];

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState('admin@peoplepay360.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleDemoAccountSelect = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setSelectedRole(account.role as UserRole);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      await login(email, selectedRole);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
    }
  };

  return (
    <AuthLayout
      title="Welcome to PeoplePay360"
      subtitle="Sign in to your professional workspace."
      heroHeadline="Modern HR & Payroll, simplified."
      heroSubheadline="Manage attendance, process payroll, and empower your workforce from one unified platform."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <Alert variant="danger" title="Authentication Error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
            Demo Accounts
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleDemoAccountSelect(acc)}
                className={`py-1.5 px-3 text-xs font-medium rounded-md border text-left flex items-center gap-2 transition-colors ${
                  selectedRole === acc.role
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <UserCircle className="w-3.5 h-3.5" />
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="EMAIL ADDRESS"
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          startIcon={<Mail className="w-4 h-4" />}
        />

        <div className="relative">
          <Input
            label="PASSWORD"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            startIcon={<Lock className="w-4 h-4" />}
          />
          {/* Note: In a real app, we'd toggle input type between 'password' and 'text'. Here we just rely on standard Input for now. */}
        </div>
        
        <div className="flex items-center justify-between text-xs font-medium">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600">
            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            Remember me
          </label>
          <a href="#" className="text-blue-600 hover:text-blue-700">Forgot password?</a>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          isLoading={loading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="mt-2"
        >
          Sign In
        </Button>
      </form>
    </AuthLayout>
  );
};
