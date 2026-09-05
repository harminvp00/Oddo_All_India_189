import React from 'react';
import type { ButtonVariant, ButtonSize } from '../../types';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant | 'teal';
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold tracking-tight transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none select-none rounded-lg cursor-pointer';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[32px]',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2 min-h-[38px]',
    lg: 'px-5 py-2.5 text-sm sm:text-base gap-2.5 min-h-[44px]',
  };

  const variantStyles: Record<string, string> = {
    primary: 'bg-[#714B67] hover:bg-[#5B3A52] active:bg-[#482C40] text-white shadow-xs focus:ring-[#714B67] border border-transparent',
    teal: 'bg-[#017E84] hover:bg-[#00686D] active:bg-[#005458] text-white shadow-xs focus:ring-[#017E84] border border-transparent',
    secondary: 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 focus:ring-slate-400 border border-slate-200',
    danger: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs focus:ring-rose-500 border border-transparent',
    ghost: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 focus:ring-[#714B67] border border-transparent',
    outline: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border border-slate-200 focus:ring-[#714B67] shadow-xs',
  };

  const widthStyle = fullWidth ? 'w-full' : '';
  const spinnerVariant = variant === 'primary' || variant === 'danger' || variant === 'teal' ? 'white' : 'primary';

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.primary} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" variant={spinnerVariant} />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
