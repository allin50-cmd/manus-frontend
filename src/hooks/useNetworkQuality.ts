import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useEffect, useState } from 'react';

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

interface NetworkStats {
  quality: NetworkQuality;
  latencyMs: number;
  packets: number;
}

export function useNetworkQuality(): NetworkStats {
  const online = useOnlineStatus();
  const [latency, setLatency] = useState(0);
  const [packets, setPackets] = useState(0);

  useEffect(() => {
    if (!online) {
      setLatency(0);
      return;
    }

    const interval = setInterval(async () => {
      const start = performance.now();
      try {
        await fetch('/status', { method: 'HEAD' });
        const elapsed = Math.round(performance.now() - start);
        setLatency((prev) => Math.round((prev + elapsed) / 2));
        setPackets((p) => p + 1);
      } catch {
        // Network error, don't update
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [online]);

  const quality: NetworkQuality = !online
    ? 'offline'
    : latency < 100
      ? 'excellent'
      : latency < 250
        ? 'good'
        : latency < 500
          ? 'fair'
          : 'poor';

  return { quality, latencyMs: latency, packets };
}
