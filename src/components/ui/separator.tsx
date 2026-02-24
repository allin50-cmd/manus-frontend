import React from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Separator({ orientation = 'horizontal', className }: SeparatorProps) {
  return (
    <div
      className={cn(
        'bg-white/10',
        orientation === 'horizontal' ? 'w-full h-px' : 'h-full w-px',
        className
      )}
    />
  );
}
