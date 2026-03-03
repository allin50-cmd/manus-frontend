import { HTMLAttributes } from 'react';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}

export function Alert({ className = '', variant = 'default', children, ...props }: AlertProps) {
  const variants: Record<string, string> = {
    default: 'bg-blue-50 border-blue-200 text-blue-800',
    destructive: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  };
  return (
    <div className={`rounded-xl border p-4 ${variants[variant]} ${className}`} role="alert" {...props}>
      {children}
    </div>
  );
}

export function AlertDescription({ className = '', children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm ${className}`} {...props}>{children}</p>;
}
