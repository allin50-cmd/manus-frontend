import React from 'react';
import { cn } from '@/lib/utils';
export function Alert({ className, variant: _variant, ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: string }) {
  return <div role="alert" className={cn('relative w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm', className)} {...props} />;
}
export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-gray-700', className)} {...props} />;
}
export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn('mb-1 font-medium', className)} {...props} />;
}
