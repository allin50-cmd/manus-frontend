import React from 'react';
import { cn } from '@/lib/utils';

export type Status = 'Running' | 'Success' | 'Failed' | 'Pending' | 'Warning';

interface StatusPillProps {
  status: Status;
  className?: string;
}

const config: Record<Status, { label: string; dot: string; pill: string }> = {
  Running: { label: 'Running', dot: 'bg-blue-500 animate-pulse', pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  Success: { label: 'Success', dot: 'bg-green-500',              pill: 'bg-green-50 text-green-700 border-green-200' },
  Failed:  { label: 'Failed',  dot: 'bg-red-500',                pill: 'bg-red-50 text-red-700 border-red-200' },
  Pending: { label: 'Pending', dot: 'bg-gray-400',               pill: 'bg-gray-50 text-gray-600 border-gray-200' },
  Warning: { label: 'Warning', dot: 'bg-amber-500',              pill: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export function StatusPill({ status, className }: StatusPillProps) {
  const { label, dot, pill } = config[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', pill, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {label}
    </span>
  );
}
