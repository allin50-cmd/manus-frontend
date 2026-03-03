import { createContext, useContext, useState, ReactNode, HTMLAttributes } from 'react';

interface TabsCtxType { active: string; setActive: (v: string) => void; }
const TabsCtx = createContext<TabsCtxType>({ active: '', setActive: () => {} });

export function Tabs({ defaultValue = '', value, onValueChange, children, className = '' }: {
  defaultValue?: string; value?: string; onValueChange?: (v: string) => void;
  children: ReactNode; className?: string;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  const active = controlled ? value! : internal;
  const setActive = (v: string) => { if (!controlled) setInternal(v); onValueChange?.(v); };
  return <TabsCtx.Provider value={{ active, setActive }}><div className={className}>{children}</div></TabsCtx.Provider>;
}

export function TabsList({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex gap-1 bg-gray-100 rounded-lg p-1 w-fit ${className}`}>{children}</div>;
}

export function TabsTrigger({ value, children, className = '' }: { value: string; children: ReactNode; className?: string }) {
  const { active, setActive } = useContext(TabsCtx);
  const isActive = active === value;
  return (
    <button
      onClick={() => setActive(value)}
      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-500 hover:text-[#1A1A1A]'} ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = '' }: { value: string; children: ReactNode; className?: string }) {
  const { active } = useContext(TabsCtx);
  if (active !== value) return null;
  return <div className={className}>{children}</div>;
}
