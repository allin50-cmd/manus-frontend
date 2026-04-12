import { ShieldCheck, ShieldAlert, ShieldX, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrustScore } from '@/lib/trust/score';

interface TrustBadgeProps {
  trust: TrustScore;
  /** compact — small inline pill  |  full — banner with icon, label, tagline (default) */
  variant?: 'compact' | 'full';
  className?: string;
}

const config = {
  verified: {
    icon: ShieldCheck,
    container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    iconClass: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
  caution: {
    icon: ShieldAlert,
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    iconClass: 'text-amber-500',
    dot: 'bg-amber-500',
  },
  'high-risk': {
    icon: ShieldX,
    container: 'bg-red-50 border-red-200 text-red-800',
    iconClass: 'text-red-500',
    dot: 'bg-red-500',
  },
  unverified: {
    icon: Shield,
    container: 'bg-slate-50 border-slate-200 text-slate-600',
    iconClass: 'text-slate-400',
    dot: 'bg-slate-400',
  },
} as const;

export function TrustBadge({ trust, variant = 'full', className }: TrustBadgeProps) {
  const { icon: Icon, container, iconClass, dot } = config[trust.level];

  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold',
          container,
          className,
        )}
      >
        <Icon className={cn('w-3.5 h-3.5', iconClass)} />
        {trust.label}
      </span>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-4 py-3',
        container,
        className,
      )}
    >
      {/* Icon */}
      <div className="shrink-0">
        <Icon className={cn('w-6 h-6', iconClass)} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-none">{trust.label}</p>
        <p className="text-xs mt-0.5 opacity-80">{trust.tagline}</p>
      </div>

      {/* Live indicator dot */}
      <span className="shrink-0 flex items-center gap-1.5 text-xs opacity-70">
        <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
        Live
      </span>
    </div>
  );
}
