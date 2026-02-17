import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'border-transparent bg-blue-600 text-white': variant === 'default',
          'border-transparent bg-gray-100 text-gray-800': variant === 'secondary',
          'border-transparent bg-red-600 text-white': variant === 'destructive',
          'border-gray-200 text-gray-800': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
}
