import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, UserCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'ADMIN', email: 'admin@peoplepay360.com', name: 'System Admin', label: 'Admin' },
  { role: 'HR_MANAGER', email: 'sarah.connor@peoplepay360.com', name: 'Sarah Connor', label: 'HR Manager' },
  { role: 'HR_PAYROLL_USER', email: 'krish.s@peoplepay360.com', name: 'Krish Solanki', label: 'HR Payroll User' },
];

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState('admin@peoplepay360.com');
  const [password, setPassword] = useState('Password123!');
  const [selectedEmail, setSelectedEmail] = useState('admin@peoplepay360.com');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleDemoAccountSelect = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword('Password123!');
    setSelectedEmail(account.email);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    }
  };

  return (
    <AuthLayout
      title="Welcome to PeoplePay 360"
      subtitle="Sign in with your organizational account to access your workspace."
      heroHeadline="Modern HR & Payroll, unified."
      heroSubheadline="Streamline attendance, manage workforce roles, and process payroll with enterprise-grade security."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <Alert variant="danger" title="Authentication Failed" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Quick Demo Sign-In
            </label>
            <span className="text-[11px] text-slate-400 font-medium">PostgreSQL Connected</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleDemoAccountSelect(acc)}
                className={`p-2.5 text-xs font-semibold rounded-lg border text-left transition-all duration-150 flex flex-col justify-center ${
                  selectedEmail === acc.email
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <UserCircle className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="truncate">{acc.label}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal truncate">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>

        <Input
          label="EMAIL ADDRESS"
          type="email"
          required
          placeholder="name@peoplepay360.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSelectedEmail(e.target.value);
          }}
          startIcon={<Mail className="w-4 h-4 text-slate-400" />}
        />

        <div className="relative">
          <Input
            label="PASSWORD"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            startIcon={<Lock className="w-4 h-4 text-slate-400" />}
            endIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
          <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800">
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
            />
            Keep me signed in
          </label>
          <span className="text-slate-400">Password: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">Password123!</code></span>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          isLoading={loading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="mt-2 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
        >
          {loading ? 'Authenticating...' : 'Sign In to Workspace'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Login;
