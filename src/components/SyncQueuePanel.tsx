import { useSyncQueue } from '@/contexts/SyncQueueContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { CloudSync, Trash2, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

export function SyncQueuePanel() {
  const { items, remove, retry, retryAll, clear } = useSyncQueue();
  const online = useOnlineStatus();

  if (items.length === 0) return null;

  const formatted = items.map((item) => ({
    ...item,
    icon: item.entityType === 'case' ? '📋' : item.entityType === 'hearing' ? '⚖️' : item.entityType === 'allocation' ? '📌' : item.entityType === 'document' ? '📄' : '📅',
    label: `${item.entityType} ${item.action}`,
  }));

  return (
    <div className="fixed bottom-6 right-6 max-w-sm bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4 z-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CloudSync className={`w-5 h-5 ${online ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
          <span className="font-semibold text-white">Pending Sync</span>
          <span className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded">{items.length}</span>
        </div>
        <button onClick={clear} className="text-slate-500 hover:text-slate-300 transition">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2 mb-3">
        {formatted.map((item) => (
          <div key={item.id} className="bg-slate-800/50 border border-slate-700 rounded p-3 text-sm">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <div className="text-slate-200 font-mono text-xs">{item.label}</div>
                  <div className="text-slate-500 text-xs">{new Date(item.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
              {item.lastError ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
            </div>
            {item.lastError && <div className="text-xs text-red-400 mb-2">{item.lastError}</div>}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Attempts: {item.attempts}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => retry(item.id)}
                  className="p-1 text-slate-400 hover:text-slate-200 transition text-xs"
                  title="Retry"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  onClick={() => remove(item.id)}
                  className="p-1 text-slate-400 hover:text-red-400 transition text-xs"
                  title="Discard"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={retryAll}
        disabled={!online}
        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded transition"
      >
        {online ? 'Sync All' : 'Waiting for network...'}
      </button>
    </div>
  );
}
