import React from 'react';
import { brand } from '../../config/brand';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';

export interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  heroHeadline = 'PeoplePay 360, simplified.',
  heroSubheadline = 'Manage your workforce, departments, job positions, and payroll in one unified platform.',
  children,
}) => {
  return (
    <div className="min-h-screen w-screen bg-[var(--canvas)] flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fadeIn">
      {/* Main Split Container matching reference winner */}
      <div className="w-full max-w-4xl bg-white border border-blue-100/80 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Side: Solid Brand Hero Panel */}
        <div className="md:col-span-5 bg-[var(--brand)] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Background Accent Orbs */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-2xl border border-white/20 backdrop-blur-xs shadow-xs">
              <img src={brand.logoMark} alt={brand.name} className="w-7 h-7 object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                {brand.name}
              </span>
              <span className="text-[10px] text-blue-100 tracking-wider uppercase font-mono mt-1 block">
                {brand.tagline}
              </span>
            </div>
          </div>

          {/* Middle Hero Content */}
          <div className="relative z-10 my-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {heroHeadline}
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed">
                {heroSubheadline}
              </p>
            </div>

            {/* Feature Chips */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold text-blue-50">
                <Sparkles className="w-4 h-4 text-blue-200 shrink-0" />
                <span>Single-token unified design system</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold text-blue-50">
                <ShieldCheck className="w-4 h-4 text-blue-200 shrink-0" />
                <span>Secure role-based authentication</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold text-blue-50">
                <Zap className="w-4 h-4 text-blue-200 shrink-0" />
                <span>Zero-latency local initialization</span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="relative z-10 text-[11px] text-blue-100 font-medium border-t border-white/15 pt-4">
            © 2026 {brand.name} • HR & Payroll System
          </div>
        </div>

        {/* Right Side: Clean Form Container */}
        <div className="md:col-span-7 bg-white p-8 sm:p-10 md:p-12 flex flex-col justify-center">
          <div className="mb-6 space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-slate-500 font-medium">{subtitle}</p>}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
