import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'purple' | 'cyan' | 'gold' | 'green' | 'red' | 'orange' | 'gray';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-gray-300 border-white/20',
  purple:  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  cyan:    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  gold:    'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  green:   'bg-green-500/20 text-green-300 border-green-500/30',
  red:     'bg-red-500/20 text-red-300 border-red-500/30',
  orange:  'bg-orange-500/20 text-orange-300 border-orange-500/30',
  gray:    'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-400',
  purple:  'bg-purple-400',
  cyan:    'bg-cyan-400',
  gold:    'bg-yellow-400',
  green:   'bg-green-400',
  red:     'bg-red-400',
  orange:  'bg-orange-400',
  gray:    'bg-gray-500',
};

export function Badge({ className, variant = 'default', dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
