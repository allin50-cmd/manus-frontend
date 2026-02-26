import React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
}
export function Select({ children, onValueChange, onChange, className, ...props }: SelectProps & { children?: React.ReactNode }) {
  return (
    <SelectTrigger className={className}>
      <select
        onChange={(e) => { onChange?.(e); onValueChange?.(e.target.value); }}
        className="w-full bg-transparent focus:outline-none text-sm"
        {...props}
      >{children}</select>
    </SelectTrigger>
  );
}
export function SelectTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2', className)}>{children}</div>;
}
export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-gray-400 text-sm">{placeholder}</span>;
}
export function SelectContent({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children as string}</option>;
}
