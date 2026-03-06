import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

const STATUS_STYLES: Record<string, string> = {
  // Green - compliant/good
  compliant: 'bg-green-100 text-green-800',
  in_sync: 'bg-green-100 text-green-800',
  active: 'bg-green-100 text-green-800',
  accepted: 'bg-green-100 text-green-800',
  verified: 'bg-green-100 text-green-800',
  approved: 'bg-green-100 text-green-800',
  locked: 'bg-green-100 text-green-800',
  matched: 'bg-green-100 text-green-800',
  online: 'bg-green-100 text-green-800',

  // Blue - submitted/in progress
  submitted: 'bg-blue-100 text-blue-800',
  validated: 'bg-blue-100 text-blue-800',
  processing: 'bg-blue-100 text-blue-800',
  extracted: 'bg-blue-100 text-blue-800',
  uploaded: 'bg-blue-100 text-blue-800',
  pending_receipt: 'bg-blue-100 text-blue-800',

  // Gray - draft/neutral
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-gray-100 text-gray-700',
  unverified: 'bg-gray-100 text-gray-700',
  unmatched: 'bg-gray-100 text-gray-700',
  dormant: 'bg-gray-100 text-gray-700',

  // Amber - warning
  due_soon: 'bg-amber-100 text-amber-800',
  variance_detected: 'bg-amber-100 text-amber-800',
  warning: 'bg-amber-100 text-amber-800',
  split: 'bg-amber-100 text-amber-800',
  non_vat: 'bg-amber-100 text-amber-800',

  // Red - error/blocked
  overdue: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  critical: 'bg-red-100 text-red-800',
  dissolved: 'bg-red-100 text-red-800',
  duplicate: 'bg-red-100 text-red-800',
  liquidation: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  in_sync: 'In Sync',
  variance_detected: 'Variance',
  due_soon: 'Due Soon',
  pending_receipt: 'Receipt Needed',
  non_vat: 'Non-VAT',
};

export default function StatusBadge({ status, label, className, size = 'md' }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700';
  const displayLabel = label ?? STATUS_LABELS[status] ?? status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium capitalize',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs',
        style,
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
