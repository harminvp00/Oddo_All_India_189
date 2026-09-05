import React from 'react';
import type { AlertVariant } from '../../types';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  onClose,
  className = '',
  ...props
}) => {
  const variantStyles: Record<
    AlertVariant,
    { container: string; defaultIcon: React.ReactNode }
  > = {
    success: {
      container: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
      defaultIcon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
    warning: {
      container: 'bg-amber-50 text-amber-900 border-amber-200/80',
      defaultIcon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    },
    danger: {
      container: 'bg-rose-50 text-rose-900 border-rose-200/80',
      defaultIcon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    },
    info: {
      container: 'bg-blue-50 text-blue-900 border-blue-200/80',
      defaultIcon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
    },
  };

  const style = variantStyles[variant] || variantStyles.info;

  return (
    <div
      role="alert"
      className={`p-4 rounded-2xl border flex items-start gap-3 text-sm ${style.container} ${className}`}
      {...props}
    >
      <div className="pt-0.5">{icon || style.defaultIcon}</div>

      <div className="flex-1 flex flex-col gap-0.5">
        {title && <span className="font-bold text-slate-900">{title}</span>}
        {children && <div className="text-slate-700 text-xs leading-relaxed font-medium">{children}</div>}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
