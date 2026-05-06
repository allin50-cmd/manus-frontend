import { createContext, useContext, useEffect, useRef, useState } from 'react';

export interface PendingSyncItem {
  id: string;
  entityType: 'case' | 'hearing' | 'allocation' | 'document' | 'diary';
  action: string;
  timestamp: number;
  attempts: number;
  lastError?: string;
  data: Record<string, unknown>;
}

interface SyncQueueContextType {
  items: PendingSyncItem[];
  add: (item: Omit<PendingSyncItem, 'id' | 'timestamp' | 'attempts'>) => void;
  remove: (id: string) => void;
  retry: (id: string) => Promise<void>;
  retryAll: () => Promise<void>;
  clear: () => void;
}

const SyncQueueContext = createContext<SyncQueueContextType | null>(null);

export function SyncQueueProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<PendingSyncItem[]>(() => {
    try {
      const stored = localStorage.getItem('clerkos:sync-queue');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveToStorage = (queue: PendingSyncItem[]) => {
    localStorage.setItem('clerkos:sync-queue', JSON.stringify(queue));
  };

  const add = (item: Omit<PendingSyncItem, 'id' | 'timestamp' | 'attempts'>) => {
    const newItem: PendingSyncItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      attempts: 0,
    };
    const updated = [...items, newItem];
    setItems(updated);
    saveToStorage(updated);
  };

  const remove = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    saveToStorage(updated);
  };

  const retry = async (id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, attempts: i.attempts + 1, lastError: undefined } : i,
      ),
    );
  };

  const retryAll = async () => {
    setItems((prev) =>
      prev.map((i) => ({ ...i, attempts: i.attempts + 1, lastError: undefined })),
    );
  };

  const clear = () => {
    setItems([]);
    saveToStorage([]);
  };

  return (
    <SyncQueueContext.Provider value={{ items, add, remove, retry, retryAll, clear }}>
      {children}
    </SyncQueueContext.Provider>
  );
}

export function useSyncQueue() {
  const ctx = useContext(SyncQueueContext);
  if (!ctx) throw new Error('useSyncQueue must be used within SyncQueueProvider');
  return ctx;
}
