import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'purple' | 'cyan' | 'gold' | 'none';
}

export function Card({ className, glow = 'none', ...props }: CardProps) {
  const glowClass = {
    purple: 'shadow-lg shadow-purple-500/10 border-purple-500/20',
    cyan:   'shadow-lg shadow-cyan-500/10 border-cyan-500/20',
    gold:   'shadow-lg shadow-yellow-500/10 border-yellow-500/20',
    none:   'border-white/10',
  }[glow];

  return (
    <div
      className={cn(
        'bg-[#1a1d2e] border rounded-xl transition-all duration-200',
        glowClass,
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pb-3', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-white leading-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-gray-400 mt-1', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-4', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-5 py-3 border-t border-white/5 flex items-center gap-3', className)}
      {...props}
    />
  );
}
