import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType>({
  value: '',
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
});

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
}

export function Select({ value = '', onValueChange = () => {}, children }: SelectProps) {
  const [open, setOpen] = useState(false);
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useContext(SelectContext);
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx(
          'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
        <svg className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useContext(SelectContext);
  return <span className={value ? '' : 'text-gray-400'}>{value || placeholder}</span>;
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useContext(SelectContext);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (contentRef.current && !contentRef.current.closest('.relative')?.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      if (open) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, setOpen]);

    if (!open) return null;
    return (
      <div
        ref={contentRef}
        className={clsx(
          'absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white p-1 shadow-md',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectContent.displayName = 'SelectContent';

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const { onValueChange, setOpen, value: currentValue } = useContext(SelectContext);
    return (
      <div
        ref={ref}
        className={clsx(
          'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm hover:bg-gray-100',
          currentValue === value && 'bg-gray-100',
          className
        )}
        onClick={() => {
          onValueChange(value);
          setOpen(false);
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectItem.displayName = 'SelectItem';
