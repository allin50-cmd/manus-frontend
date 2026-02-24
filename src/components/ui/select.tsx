/**
 * Select component — supports BOTH usage patterns:
 *
 * 1. Simple options API (dashboard pages):
 *    <Select value={v} onValueChange={setV} options={[...]} />
 *
 * 2. Compound children API (existing pages):
 *    <Select value={v} onValueChange={setV}>
 *      <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
 *      <SelectContent>
 *        <SelectItem value="a">Option A</SelectItem>
 *      </SelectContent>
 *    </Select>
 */
import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface SelectCtx {
  value: string;
  open: boolean;
  setOpen: (o: boolean) => void;
  selectValue: (v: string) => void;
  placeholder: string;
  selectedLabel: string;
}

const SelectContext = createContext<SelectCtx>({
  value: '', open: false, setOpen: () => {}, selectValue: () => {},
  placeholder: 'Select...', selectedLabel: '',
});

// ─── Main Select ──────────────────────────────────────────────────────────────

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options?: SelectOption[];
  className?: string;
  disabled?: boolean;
  error?: string;
  children?: React.ReactNode;
  required?: boolean;
}

export function Select({
  value = '',
  onValueChange,
  placeholder = 'Select...',
  options,
  className,
  disabled,
  error,
  children,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = options?.find((o) => o.value === value)?.label ?? value;

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const selectValue = (v: string) => { onValueChange?.(v); setOpen(false); };

  const ctx: SelectCtx = { value, open, setOpen, selectValue, placeholder, selectedLabel };

  // ── Simple options-based API ──────────────────────────────────────────────
  if (options) {
    return (
      <SelectContext.Provider value={ctx}>
        <div ref={ref} className={cn('relative', className)}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen((o) => !o)}
            className={cn(
              'w-full flex items-center justify-between gap-2 px-3 py-2',
              'bg-white/5 border border-white/10 rounded-lg text-sm',
              'focus:outline-none focus:border-brand-purple transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500/50',
              open && 'border-brand-purple'
            )}
          >
            <span className={value ? 'text-white' : 'text-gray-500'}>
              {selectedLabel || placeholder}
            </span>
            <ChevronDown className={cn('w-4 h-4 text-gray-500 shrink-0 transition-transform', open && 'rotate-180')} />
          </button>

          {open && (
            <div className="absolute z-50 w-full mt-1 bg-[#1a1d2e] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-fade-in">
              <div className="max-h-56 overflow-y-auto py-1">
                {options.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => selectValue(opt.value)}
                    className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors',
                      opt.value === value ? 'text-brand-purple' : 'text-gray-300')}
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
      </SelectContext.Provider>
    );
  }

  // ── Compound children API ─────────────────────────────────────────────────
  return (
    <SelectContext.Provider value={ctx}>
      <div ref={ref} className={cn('relative', className)}>
        {children}
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    </SelectContext.Provider>
  );
}

// ─── Compound sub-components ──────────────────────────────────────────────────

export function SelectTrigger({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useContext(SelectContext);
  return (
    <button type="button" onClick={() => setOpen(!open)}
      className={cn(
        'w-full flex items-center justify-between gap-2 px-3 py-2',
        'bg-white/5 border border-white/10 rounded-lg text-sm text-white',
        'focus:outline-none focus:border-brand-purple transition-colors',
        open && 'border-brand-purple', className
      )}
      {...props}
    >
      {children}
      <ChevronDown className={cn('w-4 h-4 text-gray-500 shrink-0 transition-transform', open && 'rotate-180')} />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { selectedLabel, value, placeholder: ctxPlaceholder } = useContext(SelectContext);
  const label = selectedLabel || value;
  return <span className={label ? 'text-white' : 'text-gray-500'}>{label || placeholder || ctxPlaceholder}</span>;
}

export function SelectContent({ className, children }: { className?: string; children?: React.ReactNode }) {
  const { open } = useContext(SelectContext);
  if (!open) return null;
  return (
    <div className={cn('absolute z-50 w-full mt-1 bg-[#1a1d2e] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-fade-in', className)}>
      <div className="max-h-56 overflow-y-auto py-1">{children}</div>
    </div>
  );
}

export function SelectItem({ value, children, className, disabled }: {
  value: string; children?: React.ReactNode; className?: string; disabled?: boolean;
}) {
  const { value: selectedValue, selectValue } = useContext(SelectContext);
  const isSelected = selectedValue === value;
  return (
    <button type="button" disabled={disabled} onClick={() => selectValue(value)}
      className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors',
        isSelected ? 'text-brand-purple' : 'text-gray-300',
        disabled && 'opacity-40 cursor-not-allowed', className)}
    >
      <Check className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
      {children}
    </button>
  );
}

export function SelectGroup({ children }: { children?: React.ReactNode }) {
  return <div>{children}</div>;
}

export function SelectLabel({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={cn('px-3 py-1.5 text-xs text-gray-600 font-semibold uppercase tracking-wider', className)}>{children}</div>;
}

export function SelectSeparator({ className }: { className?: string }) {
  return <div className={cn('my-1 h-px bg-white/10', className)} />;
}
