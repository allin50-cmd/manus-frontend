import { useNetworkQuality } from '@/hooks/useNetworkQuality';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Wifi, WifiOff } from 'lucide-react';

export function NetworkIndicator() {
  const online = useOnlineStatus();
  const { quality, latencyMs } = useNetworkQuality();

  const qualityColor = {
    excellent: 'text-emerald-500',
    good: 'text-cyan-500',
    fair: 'text-amber-500',
    poor: 'text-orange-500',
    offline: 'text-red-500',
  }[quality];

  const qualityLabel = {
    excellent: '⚡ Excellent',
    good: '✓ Good',
    fair: '⊘ Fair',
    poor: '⚠ Poor',
    offline: '✗ Offline',
  }[quality];

  return (
    <div className="fixed bottom-4 left-4 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm z-40">
      <div className="flex items-center gap-3">
        {online ? (
          <Wifi className={`w-4 h-4 ${qualityColor}`} />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
        <div>
          <div className={`font-medium ${qualityColor}`}>{qualityLabel}</div>
          {online && latencyMs > 0 && (
            <div className="text-xs text-slate-400">{latencyMs}ms</div>
          )}
        </div>
      </div>
    </div>
  );
}
