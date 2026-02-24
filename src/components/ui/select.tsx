import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  className?: string;
  disabled?: boolean;
  error?: string;
}

export function Select({ value, onValueChange, placeholder = 'Select...', options, className, disabled, error }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2',
          'bg-white/5 border border-white/10 rounded-lg text-sm',
          'focus:outline-none focus:border-brand-purple',
          'transition-colors duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500/50',
          open && 'border-brand-purple'
        )}
      >
        <span className={selected ? 'text-white' : 'text-gray-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-[#1a1d2e] border border-white/10 rounded-xl shadow-xl shadow-black/50 overflow-hidden animate-fade-in">
          <div className="max-h-56 overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onValueChange?.(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                  'hover:bg-white/5 transition-colors',
                  opt.value === value ? 'text-brand-purple' : 'text-gray-300'
                )}
              >
                <Check className={cn('w-3.5 h-3.5 shrink-0', opt.value === value ? 'opacity-100' : 'opacity-0')} />
                <div>
                  <div>{opt.label}</div>
                  {opt.description && <div className="text-xs text-gray-500">{opt.description}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

// Legacy wrappers to match existing page imports
export function SelectContent({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) { return null; }
export function SelectTrigger({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function SelectValue({ placeholder }: { placeholder?: string }) { return <span>{placeholder}</span>; }
