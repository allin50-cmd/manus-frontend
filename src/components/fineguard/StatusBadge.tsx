import type { DeadlineStatus } from '../../lib/api';

interface StatusBadgeProps {
  status: DeadlineStatus;
  size?: 'sm' | 'md' | 'lg';
}

const CONFIG: Record<
  DeadlineStatus,
  { label: string; dot: string; text: string; bg: string; ring: string }
> = {
  safe: {
    label: 'No issues detected',
    dot: 'bg-green-400',
    text: 'text-green-400',
    bg: 'bg-green-400/10',
    ring: 'ring-green-400/20',
  },
  due_soon: {
    label: 'Due soon',
    dot: 'bg-amber-400',
    text: 'text-amber-400',
    bg: 'bg-amber-400/10',
    ring: 'ring-amber-400/20',
  },
  urgent: {
    label: 'Action needed now',
    dot: 'bg-red-400',
    text: 'text-red-400',
    bg: 'bg-red-400/10',
    ring: 'ring-red-400/20',
  },
  overdue: {
    label: 'Overdue',
    dot: 'bg-red-500',
    text: 'text-red-500',
    bg: 'bg-red-500/10',
    ring: 'ring-red-500/20',
  },
  handled: {
    label: 'Handled',
    dot: 'bg-gray-400',
    text: 'text-gray-400',
    bg: 'bg-gray-400/10',
    ring: 'ring-gray-400/20',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const c = CONFIG[status];
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const padding = size === 'sm' ? 'px-2 py-0.5' : size === 'lg' ? 'px-4 py-2' : 'px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ${padding} ${textSize} ${c.text} ${c.bg} ${c.ring}`}
    >
      <span className={`rounded-full flex-shrink-0 ${dotSize} ${c.dot}`} />
      {c.label}
    </span>
  );
}

export function StatusDot({ status }: { status: DeadlineStatus }) {
  const c = CONFIG[status];
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />;
}
