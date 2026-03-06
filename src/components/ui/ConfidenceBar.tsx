import { cn } from '@/lib/utils';

interface ConfidenceBarProps {
  confidence: number;
  showLabel?: boolean;
  threshold?: number;
  className?: string;
}

export default function ConfidenceBar({
  confidence,
  showLabel = true,
  threshold = 98,
  className,
}: ConfidenceBarProps) {
  const isPassing = confidence >= threshold;
  const isWarning = confidence >= 90 && confidence < threshold;
  const isFailing = confidence < 90;

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">OCR Confidence</span>
          <span
            className={cn(
              'text-xs font-bold',
              isPassing ? 'text-green-600' : isWarning ? 'text-amber-600' : 'text-red-600'
            )}
          >
            {confidence.toFixed(1)}%
            {!isPassing && (
              <span className="ml-1 font-normal text-gray-500">
                (min. {threshold}%)
              </span>
            )}
          </span>
        </div>
      )}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isPassing ? 'bg-green-500' : isWarning ? 'bg-amber-500' : 'bg-red-500'
          )}
          style={{ width: `${Math.min(100, confidence)}%` }}
        />
      </div>
      {!isPassing && (
        <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
          ⚠ Confidence below threshold — manual verification required
        </p>
      )}
    </div>
  );
}
