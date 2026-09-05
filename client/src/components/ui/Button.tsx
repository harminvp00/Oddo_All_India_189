import React from 'react';
import type { ButtonVariant, ButtonSize } from '../../types';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
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
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-tight transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none select-none rounded-2xl cursor-pointer';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5 min-h-[34px]',
    md: 'px-4.5 py-2.5 text-xs sm:text-sm gap-2 min-h-[42px]',
    lg: 'px-6 py-3 text-sm sm:text-base gap-2.5 min-h-[48px]',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-[var(--brand)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-active)] text-white shadow-xs focus:ring-[var(--brand)] border border-transparent',
    secondary: 'bg-blue-100/70 hover:bg-blue-200/80 active:bg-blue-300 text-blue-900 focus:ring-blue-400 border border-blue-200/60',
    danger: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs focus:ring-rose-500 border border-transparent',
    ghost: 'bg-transparent hover:bg-blue-100/50 active:bg-blue-200/60 text-blue-900 focus:ring-[var(--brand)] border border-transparent',
    outline: 'bg-white hover:bg-blue-50 active:bg-blue-100 text-slate-800 border border-blue-200/80 focus:ring-[var(--brand)] shadow-xs',
  };

  const widthStyle = fullWidth ? 'w-full' : '';
  const spinnerVariant = variant === 'primary' || variant === 'danger' ? 'white' : 'primary';

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
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
