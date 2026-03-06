import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface VATBoxCardProps {
  boxNumber: number;
  label: string;
  value: number;
  isTotal?: boolean;
  isDue?: boolean;
  isReclaim?: boolean;
  description?: string;
  className?: string;
}

export default function VATBoxCard({
  boxNumber,
  label,
  value,
  isTotal,
  isDue,
  isReclaim,
  description,
  className,
}: VATBoxCardProps) {
  const isHighlighted = isTotal || isDue || isReclaim;

  return (
    <div
      className={cn(
        'card p-4 relative overflow-hidden',
        isDue && value > 0 && 'border-red-200 bg-red-50',
        isReclaim && value > 0 && 'border-green-200 bg-green-50',
        isTotal && 'border-blue-200',
        className
      )}
    >
      {/* Box number indicator */}
      <div className="absolute top-3 right-3">
        <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
          Box {boxNumber}
        </span>
      </div>

      <div className="pr-12">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 leading-tight">
          {label}
        </p>
        <p
          className={cn(
            'text-xl font-bold font-mono',
            isDue && value > 0 ? 'text-red-700' :
            isReclaim && value > 0 ? 'text-green-700' :
            isTotal ? 'text-blue-700' :
            'text-gray-900'
          )}
        >
          {formatCurrency(value)}
        </p>
        {description && (
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        )}
      </div>

      {isHighlighted && (
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 h-0.5',
            isDue ? 'bg-red-400' : isReclaim ? 'bg-green-400' : 'bg-blue-400'
          )}
        />
      )}
    </div>
  );
}
