import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'purple' | 'cyan' | 'gold' | 'green' | 'red';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const colorClasses = {
  purple: 'bg-brand-purple',
  cyan:   'bg-brand-cyan',
  gold:   'bg-brand-gold',
  green:  'bg-green-500',
  red:    'bg-red-500',
};

const sizeClasses = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2.5',
};

export function Progress({ value, max = 100, className, color = 'purple', size = 'md', animated }: ProgressProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={cn('w-full bg-white/10 rounded-full overflow-hidden', sizeClasses[size], className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500', colorClasses[color], animated && 'animate-pulse')}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
