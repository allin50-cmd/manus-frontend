import { createContext, useContext, useState, ReactNode } from 'react';

// Lightweight native-select wrappers matching shadcn's API surface
interface SelectContextType {
  value: string;
  onValueChange?: (val: string) => void;
  required?: boolean;
}
const SelectCtx = createContext<SelectContextType>({ value: '' });

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (val: string) => void;
  required?: boolean;
  children: ReactNode;
}

export function Select({ value, defaultValue = '', onValueChange, required, children }: SelectProps) {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value! : internal;
  const handleChange = (val: string) => {
    if (!controlled) setInternal(val);
    onValueChange?.(val);
  };
  return (
    <SelectCtx.Provider value={{ value: current, onValueChange: handleChange, required }}>
      {children}
    </SelectCtx.Provider>
  );
}

export function SelectTrigger({ className = '', children }: { className?: string; children?: ReactNode }) {
  const { value, onValueChange, required } = useContext(SelectCtx);
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        required={required}
        onChange={e => onValueChange?.(e.target.value)}
        className="w-full appearance-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A64A]/30 bg-white pr-8"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">▾</span>
    </div>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useContext(SelectCtx);
  return <option value="" disabled hidden>{value || placeholder}</option>;
}

// className accepted but ignored — native <select> renders its own dropdown
export function SelectContent({ children, className: _className }: { children: ReactNode; className?: string }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }: { value: string; children: ReactNode }) {
  return <option value={value}>{children}</option>;
}
