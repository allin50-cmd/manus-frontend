import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { OfflineQueueItem } from '@/types/fineguard';

interface OfflineContextValue {
  isOnline: boolean;
  queuedItems: OfflineQueueItem[];
  addToQueue: (item: Omit<OfflineQueueItem, 'id' | 'createdAt' | 'retryCount'>) => void;
  clearQueue: () => void;
  pendingCount: number;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedItems, setQueuedItems] = useState<OfflineQueueItem[]>(() => {
    try {
      const stored = localStorage.getItem('fg_offline_queue');
      return stored ? (JSON.parse(stored) as OfflineQueueItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('fg_offline_queue', JSON.stringify(queuedItems));
  }, [queuedItems]);

  const addToQueue = useCallback(
    (item: Omit<OfflineQueueItem, 'id' | 'createdAt' | 'retryCount'>) => {
      const newItem: OfflineQueueItem = {
        ...item,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        retryCount: 0,
      };
      setQueuedItems(prev => [...prev, newItem]);
    },
    []
  );

  const clearQueue = useCallback(() => {
    setQueuedItems([]);
  }, []);

  return (
    <OfflineContext.Provider
      value={{ isOnline, queuedItems, addToQueue, clearQueue, pendingCount: queuedItems.length }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOffline must be used within OfflineProvider');
  return ctx;
}
