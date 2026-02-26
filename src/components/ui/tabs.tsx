import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

const TabsCtx = createContext<{ active: string; set: (v: string) => void }>({ active: '', set: () => {} });

export function Tabs({ defaultValue, value, onValueChange, children, className }:
  { defaultValue?: string; value?: string; onValueChange?: (v: string) => void; children: React.ReactNode; className?: string }) {
  const [internal, setInternal] = useState(defaultValue ?? '');
  const active = value ?? internal;
  const set = (v: string) => { setInternal(v); onValueChange?.(v); };
  return <TabsCtx.Provider value={{ active, set }}><div className={cn('', className)}>{children}</div></TabsCtx.Provider>;
}
export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('inline-flex rounded-lg bg-gray-100 p-1 gap-1', className)}>{children}</div>;
}
export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { active, set } = useContext(TabsCtx);
  return (
    <button
      onClick={() => set(value)}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        active === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
        className,
      )}
    >{children}</button>
  );
}
export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { active } = useContext(TabsCtx);
  if (active !== value) return null;
  return <div className={cn('mt-2', className)}>{children}</div>;
}
