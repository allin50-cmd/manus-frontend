import { Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { DeadlineStatus } from '../../lib/api';

interface DeadlineCardProps {
  label: string;
  dueDate: string | null;
  status: DeadlineStatus;
  daysUntil?: number | null;
}

const ICONS: Record<DeadlineStatus, React.ElementType> = {
  safe: CheckCircle,
  due_soon: Clock,
  urgent: AlertTriangle,
  overdue: AlertTriangle,
  handled: CheckCircle,
};

const COLORS: Record<DeadlineStatus, { icon: string; border: string; bg: string }> = {
  safe: { icon: 'text-green-400', border: 'border-green-400/20', bg: 'bg-green-400/5' },
  due_soon: { icon: 'text-amber-400', border: 'border-amber-400/30', bg: 'bg-amber-400/5' },
  urgent: { icon: 'text-red-400', border: 'border-red-400/40', bg: 'bg-red-400/5' },
  overdue: { icon: 'text-red-500', border: 'border-red-500/40', bg: 'bg-red-500/5' },
  handled: { icon: 'text-gray-400', border: 'border-gray-400/20', bg: 'bg-gray-400/5' },
};

export function DeadlineCard({ label, dueDate, status, daysUntil }: DeadlineCardProps) {
  const Icon = ICONS[status];
  const c = COLORS[status];

  const dueDateFormatted = dueDate
    ? new Date(dueDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Not available';

  const daysText =
    daysUntil == null
      ? null
      : daysUntil < 0
      ? `${Math.abs(daysUntil)} days overdue`
      : daysUntil === 0
      ? 'Due today'
      : `${daysUntil} days remaining`;

  return (
    <div className={`rounded-lg border p-4 ${c.border} ${c.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${c.icon}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/90">{label}</p>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="w-3.5 h-3.5 text-white/40" />
            <span className="text-sm text-white/60">{dueDateFormatted}</span>
          </div>
          {daysText && (
            <p className={`text-xs mt-1 font-medium ${c.icon}`}>{daysText}</p>
          )}
        </div>
      </div>
    </div>
  );
}
