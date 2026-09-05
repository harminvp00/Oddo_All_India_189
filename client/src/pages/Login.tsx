import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

        <Input
          label="EMAIL ADDRESS"
          type="email"
          required
          placeholder="name@peoplepay360.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
                className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
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
