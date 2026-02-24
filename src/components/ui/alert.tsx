import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

type AlertVariant = 'default' | 'info' | 'success' | 'warning' | 'error';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
}

const variantConfig: Record<AlertVariant, { classes: string; Icon: React.ElementType }> = {
  default: { classes: 'bg-white/5 border-white/10 text-gray-300', Icon: Info },
  info:    { classes: 'bg-blue-500/10 border-blue-500/30 text-blue-300', Icon: Info },
  success: { classes: 'bg-green-500/10 border-green-500/30 text-green-300', Icon: CheckCircle2 },
  warning: { classes: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300', Icon: AlertTriangle },
  error:   { classes: 'bg-red-500/10 border-red-500/30 text-red-300', Icon: AlertCircle },
};

export function Alert({ variant = 'default', title, className, children, ...props }: AlertProps) {
  const { classes, Icon } = variantConfig[variant];
  return (
    <div
      className={cn('flex gap-3 p-3 border rounded-xl text-sm', classes, className)}
      {...props}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div>
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm', className)} {...props} />;
}
