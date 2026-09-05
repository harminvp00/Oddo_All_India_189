import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      startIcon,
      endIcon,
      required,
      id,
      disabled,
      className = '',
      containerClassName = '',
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="text-[11px] font-extrabold text-blue-950/70 tracking-wider uppercase">
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {startIcon && (
            <div className="absolute left-3.5 pointer-events-none text-blue-400 flex items-center justify-center">
              {startIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            aria-invalid={!!error}
            className={`w-full px-4 py-2.5 text-xs sm:text-sm text-slate-900 bg-white border rounded-2xl transition-all duration-150 focus:outline-none focus:ring-2 disabled:bg-blue-50/40 disabled:text-slate-400 disabled:cursor-not-allowed placeholder:text-slate-400 shadow-xs ${
              startIcon ? 'pl-10' : ''
            } ${endIcon ? 'pr-10' : ''} ${
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900'
                : 'border-blue-200/80 focus:border-[var(--brand)] focus:ring-[var(--brand)]/20'
            } ${className}`}
            {...props}
          />

          {endIcon && (
            <div className="absolute right-3.5 flex items-center justify-center text-blue-400">
              {endIcon}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500 font-medium">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
