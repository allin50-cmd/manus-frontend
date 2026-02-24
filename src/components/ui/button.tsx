import React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'link';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  default:   'bg-white/10 hover:bg-white/15 text-white border border-white/10',
  primary:   'bg-brand-purple hover:bg-purple-600 text-white shadow-lg shadow-purple-500/20',
  secondary: 'bg-brand-cyan/20 hover:bg-brand-cyan/30 text-cyan-300 border border-cyan-500/30',
  ghost:     'hover:bg-white/5 text-gray-400 hover:text-white',
  danger:    'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30',
  outline:   'border border-white/20 hover:border-white/40 text-white hover:bg-white/5',
  link:      'text-brand-purple hover:text-purple-400 underline-offset-4 hover:underline p-0 h-auto',
};

const sizeClasses: Record<Size, string> = {
  xs:   'h-6 px-2 text-xs rounded-md gap-1',
  sm:   'h-8 px-3 text-sm rounded-lg gap-1.5',
  md:   'h-9 px-4 text-sm rounded-lg gap-2',
  lg:   'h-11 px-6 text-base rounded-xl gap-2',
  icon: 'h-9 w-9 rounded-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-1 focus-visible:ring-offset-brand-navy',
          'select-none active:scale-[0.98]',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
        ) : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
