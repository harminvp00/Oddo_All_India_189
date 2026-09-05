import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';
import { brand } from '../config/brand';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState('you@company.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      await login(email);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your organization account."
      heroHeadline="Your daily workflow, simplified."
      heroSubheadline="Connect with your team, manage tasks, and make every iteration count."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <Alert variant="danger" title="Authentication Error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Input
          label="EMAIL"
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          startIcon={<Mail className="w-4 h-4" />}
        />

        <Input
          label="PASSWORD"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          startIcon={<Lock className="w-4 h-4" />}
        />

        {/* Google Sign-in Option */}
        <button
          type="button"
          onClick={() => login('google.user@example.com').then(() => navigate('/dashboard'))}
          className="w-full py-2.5 px-4 bg-white border border-purple-200/80 rounded-2xl text-xs font-semibold text-slate-700 hover:bg-purple-50/50 transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer"
        >
          <img src={brand.googleLogo} alt="Google logo" className="w-4 h-4 object-contain" />
          <span>Continue with Google</span>
        </button>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          isLoading={loading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="mt-1"
        >
          Log in
        </Button>

        <div className="text-center text-xs text-slate-500 font-medium mt-2">
          New here?{' '}
          <Link to="/register" className="font-bold text-[var(--brand)] hover:text-[var(--brand-hover)]">
            Create an account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
