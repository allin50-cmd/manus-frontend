import { cn } from '@/lib/utils';

type Variant = 'compliant' | 'warning' | 'overdue' | 'active' | 'cancelled' | 'on_track' | 'due_soon';

const variants: Record<Variant, string> = {
  compliant: 'bg-green-100 text-green-700',
  active: 'bg-green-100 text-green-700',
  on_track: 'bg-green-100 text-green-700',
  warning: 'bg-orange-100 text-orange-700',
  due_soon: 'bg-orange-100 text-orange-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

const labels: Record<Variant, string> = {
  compliant: 'Compliant',
  active: 'Active',
  on_track: 'On Track',
  warning: 'Warning',
  due_soon: 'Due Soon',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export function StatusBadge({ status, className }: { status: Variant; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[status], className)}>
      {labels[status]}
    </span>
  );
}
