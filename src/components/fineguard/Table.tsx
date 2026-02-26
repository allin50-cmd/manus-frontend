import React from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function Table<T extends object>({
  columns,
  rows,
  onRowClick,
  emptyMessage = 'No records found.',
  className,
}: TableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-gray-200 bg-white', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500', col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-gray-100 last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-brand-surface transition-colors',
                )}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className={cn('px-4 py-3 text-gray-700', col.className)}>
                    {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
