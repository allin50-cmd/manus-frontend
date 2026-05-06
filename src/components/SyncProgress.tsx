import { useSyncQueue } from '@/contexts/SyncQueueContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export function SyncProgress() {
  const { items } = useSyncQueue();
  const online = useOnlineStatus();

  const synced = items.filter((i) => !i.lastError).length;
  const failed = items.filter((i) => i.lastError).length;
  const total = items.length;

  if (total === 0) return null;

  return (
    <div className="fixed top-4 right-4 bg-slate-900 border border-slate-700 rounded-lg p-4 max-w-sm shadow-lg z-40">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">Sync Progress</span>
          <span className="text-xs text-slate-400">{synced}/{total}</span>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
            style={{ width: `${total > 0 ? (synced / total) * 100 : 0}%` }}
          />
        </div>

        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-300">
            {synced > 0 && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            <span>{synced} synced</span>
          </div>
          {failed > 0 && (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-3 h-3" />
              <span>{failed} failed</span>
            </div>
          )}
          {!online && (
            <div className="flex items-center gap-2 text-amber-400">
              <Clock className="w-3 h-3" />
              <span>Waiting for network...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
