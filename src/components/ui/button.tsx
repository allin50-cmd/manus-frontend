import React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'outline' | 'ghost' | 'destructive';
type Size    = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  default:     'bg-brand-gold hover:bg-brand-gold-dark text-white shadow',
  outline:     'border border-brand-gold text-brand-gold hover:bg-brand-gold/10 bg-transparent',
  ghost:       'text-gray-700 hover:bg-gray-100 bg-transparent',
  destructive: 'bg-red-600 hover:bg-red-700 text-white shadow',
};

const sizeClasses: Record<Size, string> = {
  sm:   'px-3 py-1.5 text-sm',
  md:   'px-4 py-2 text-sm',
  lg:   'px-6 py-3 text-base',
  icon: 'p-2',
};

export function Button({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
