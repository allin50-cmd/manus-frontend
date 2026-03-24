import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#5A4BFF] text-white',
        secondary: 'border-transparent bg-[#1A1D28] text-gray-300',
        destructive: 'border-transparent bg-red-500/20 text-red-400 border-red-500/50',
        outline: 'border-[#2A2D3A] text-white',
        success: 'border-transparent bg-green-500/20 text-green-400 border-green-500/50',
        warning: 'border-transparent bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
