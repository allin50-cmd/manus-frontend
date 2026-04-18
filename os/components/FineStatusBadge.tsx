'use client';

interface FineStatusBadgeProps {
  status: 'green' | 'amber' | 'red' | string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  green: { label: 'Safe', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  amber: { label: 'Due Soon', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  red: { label: 'Overdue', className: 'bg-red-50 text-red-700 border-red-200' },
};

export function FineStatusBadge({ status }: FineStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.green;
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
