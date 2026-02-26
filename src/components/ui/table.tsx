import React from 'react';
import { cn } from '@/lib/utils';
export function Table({ className, ...p }: React.HTMLAttributes<HTMLTableElement>) {
  return <div className="overflow-x-auto"><table className={cn('w-full text-sm', className)} {...p} /></div>;
}
export function TableHeader({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('border-b border-gray-200 bg-gray-50', className)} {...p} />;
}
export function TableBody({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-gray-100', className)} {...p} />;
}
export function TableRow({ className, ...p }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('hover:bg-gray-50 transition-colors', className)} {...p} />;
}
export function TableHead({ className, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500', className)} {...p} />;
}
export function TableCell({ className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 text-gray-700', className)} {...p} />;
}
