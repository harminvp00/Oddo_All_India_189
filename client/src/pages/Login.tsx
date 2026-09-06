import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { useAuth } from "../context/AuthContext";
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  User,
  Building2,
} from "lucide-react";

// Google full-color SVG icon
const GoogleIcon: React.FC<{ className?: string }> = ({
  className = "w-5 h-5",
}) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading, refreshProfile } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackToken = params.get("token");
    const callbackError = params.get("error");

    if (callbackError) {
      const errorMap: Record<string, string> = {
        USER_NOT_PROVISIONED: "Your Google account is not registered. Please contact an administrator to provision an account.",
        ACCOUNT_DISABLED: "This account is disabled. Please contact system administrator.",
        google_not_configured: "Google Authentication is not configured on the server.",
        missing_google_code: "Missing authorization code from Google.",
        missing_google_token: "Google did not return an identity token.",
        INVALID_GOOGLE_TOKEN: "Failed to verify Google ID token. Please try again.",
        google_auth_failed: "Google Authentication failed. Please try again.",
      };
      setError(errorMap[callbackError] || callbackError || "Google Authentication failed. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (!callbackToken) return;

    setIsGoogleLoading(true);
    localStorage.setItem("token", callbackToken);
    window.history.replaceState({}, document.title, window.location.pathname);

    refreshProfile()
      .then(() => navigate("/dashboard", { replace: true }))
      .catch((err: any) => {
        localStorage.removeItem("token");
        setError(err?.message || "Google Authentication failed while loading profile. Please try again.");
      })
      .finally(() => setIsGoogleLoading(false));
  }, [navigate, refreshProfile]);

  // Standard Email/Password Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid credentials. Please verify your email and password.",
      );
    }
  };

  const handleGoogleSignIn = () => {
    setError(null);
    setIsGoogleLoading(true);
    window.location.assign(
      `${import.meta.env.VITE_API_URL || "/api"}/auth/google/login`,
    );
  };

  // Quick Demo Login Shortcut
  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    try {
      await login(demoEmail, "Password123!");
      navigate("/dashboard");
    } catch (err: any) {
      setError("Failed to login with demo account.");
    }
  };

  return (
    <AuthLayout
      title="Sign in to PeoplePay 360"
      subtitle="Enterprise Human Resource & Payroll Management Workspace."
      heroHeadline="Modern HR & Payroll, unified."
      heroSubheadline="Automate attendance tracking, calculate statutory salary rules, prevent contract overlap, and disburse payroll with zero friction."
    >
      <div className="space-y-5 animate-fadeIn">
        {error && (
          <Alert
            variant="danger"
            title="Authentication Failed"
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Google Authentication Button */}
        <Button
          type="button"
          variant="outline"
          fullWidth
          size="lg"
          onClick={handleGoogleSignIn}
          isLoading={isGoogleLoading}
          leftIcon={<GoogleIcon className="w-5 h-5" />}
          className="bg-white hover:bg-slate-50 border-slate-300 text-slate-700 font-bold text-sm shadow-xs py-2.5 transition-all hover:border-slate-400"
        >
          {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
        </Button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-2">
          <span className="bg-white text-2xl px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider relative">
            or sign in with email
          </span>
        </div>

        {/* Standard Email & Password Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="WORK EMAIL ADDRESS"
            type="email"
            required
            placeholder="admin@peoplepay360.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            startIcon={<Mail className="w-4 h-4 text-slate-400" />}
          />

          <div className="relative">
            <Input
              label="PASSWORD"
              type={showPassword ? "text" : "password"}
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
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
          </div>

          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-slate-300 text-[#714B67] focus:ring-[#714B67] h-3.5 w-3.5 accent-[#714B67]"
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
            className="mt-1 shadow-md shadow-[#714B67]/20 font-bold text-sm py-2.5"
          >
            {loading ? "Authenticating..." : "Sign In to Workspace"}
          </Button>
        </form>

        {/* Quick Demo Accounts Helper */}
        <div className="pt-4 border-t border-slate-100">
          {/* <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Quick 1-Click Demo Login</span>
            <Sparkles className="w-3.5 h-3.5 text-[#714B67]" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@peoplepay360.com")}
              className="p-2 rounded-xl bg-slate-50 hover:bg-[#714B67]/10 hover:border-[#714B67]/30 border border-slate-200 text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-900 group-hover:text-[#714B67]">
                Super Admin
              </div>
              <div className="text-[10px] text-slate-400">Full Access</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("rahul.sharma@peoplepay360.com")}
              className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700">
                Payroll Lead
              </div>
              <div className="text-[10px] text-slate-400">Engineering</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("neha.shah@peoplepay360.com")}
              className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">
                HR Manager
              </div>
              <div className="text-[10px] text-slate-400">Operations</div>
            </button>
          </div> */}
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
