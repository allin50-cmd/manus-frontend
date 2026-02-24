import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-white/5 border border-white/10 rounded-lg text-sm text-white',
              'placeholder:text-gray-500',
              'focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/50',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30',
              leftIcon ? 'pl-9 pr-3 py-2' : 'px-3 py-2',
              rightIcon ? 'pr-9' : undefined,
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
