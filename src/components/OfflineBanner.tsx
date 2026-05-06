import { RefreshCw, WifiOff } from 'lucide-react';

interface Props {
  onRefresh?: () => void;
}

export default function OfflineBanner({ onRefresh }: Props) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-between gap-4 flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-300">
          You're offline — showing cached data
        </p>
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 flex-shrink-0 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
