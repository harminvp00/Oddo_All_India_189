import React from 'react';
import type { BadgeVariant } from '../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant | 'purple' | 'teal';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium tracking-normal transition-colors border';

  const variantStyles: Record<string, string> = {
    primary: 'bg-[#F5EFF4] text-[#714B67] border-purple-200/80',
    purple: 'bg-[#F5EFF4] text-[#714B67] border-purple-200/80',
    teal: 'bg-[#E6F4F4] text-[#017E84] border-teal-200/80',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
    info: 'bg-[#E6F4F4] text-[#017E84] border-teal-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant] || variantStyles.neutral} ${className}`} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
