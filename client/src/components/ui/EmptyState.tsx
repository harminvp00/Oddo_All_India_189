import React from 'react';
import { Layers } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`p-8 sm:p-12 flex flex-col items-center justify-center text-center gap-3 bg-white rounded-2xl ${className}`}>
      <div className="p-3 bg-[var(--brand-subtle)] text-[var(--brand-hover)] border border-[var(--brand-soft)] rounded-2xl shadow-xs">
        {icon || <Layers className="w-6 h-6" />}
      </div>

      <div className="max-w-sm space-y-1">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        {description && <p className="text-xs text-slate-500 font-medium">{description}</p>}
      </div>

      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
