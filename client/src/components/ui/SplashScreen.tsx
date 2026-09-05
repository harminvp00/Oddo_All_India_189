import React from 'react';
import { brand } from '../../config/brand';

export interface SplashScreenProps {
  message?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  message = 'Initializing Application Shell...',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
      <div className="flex flex-col items-center gap-6 max-w-xs text-center">
        {/* Brand Logo with subtle pulse animation */}
        <div className="p-4 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-xs shadow-lg animate-pulseSubtle">
          <img src={brand.logo} alt={brand.name} className="h-12 w-auto object-contain" />
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-white">{brand.name}</h1>
          <p className="text-xs text-slate-400 font-mono">{brand.tagline}</p>
        </div>

        {/* Minimal Progress Spinner / Indicator */}
        <div className="flex items-center gap-3 pt-2">
          <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-300 font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
};
