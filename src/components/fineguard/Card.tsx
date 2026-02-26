import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  highlighted?: boolean;
}

export function Card({ title, description, icon, actions, children, className, highlighted }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-5 shadow-sm',
        highlighted && 'border-brand-gold ring-1 ring-brand-gold/20',
        !highlighted && 'border-gray-200',
        className,
      )}
    >
      {(icon || title || actions) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-surface text-brand-gold">
                {icon}
              </div>
            )}
            {title && (
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
              </div>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
