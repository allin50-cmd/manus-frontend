/**
 * Knowledge Base Cache Service
 * Uses IndexedDB (via localStorage fallback) for offline article caching
 */

const KB_STORE = 'kb-cache-v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

function storageKey(id: string): string {
  return `${KB_STORE}:${id}`;
}

export async function cacheArticle<T>(id: string, data: T, ttlMs = CACHE_TTL_MS): Promise<void> {
  const entry: CacheEntry<T> = { data, cachedAt: Date.now(), ttlMs };
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(entry));
  } catch {
    // Ignore storage quota errors
  }
}

export async function getCachedArticle<T>(id: string): Promise<T | null> {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.cachedAt > entry.ttlMs) {
      localStorage.removeItem(storageKey(id));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export async function invalidateArticle(id: string): Promise<void> {
  localStorage.removeItem(storageKey(id));
}

export async function clearCache(): Promise<void> {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(KB_STORE));
  keys.forEach((k) => localStorage.removeItem(k));
}

export function getCacheStats(): { count: number; sizeKb: number } {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(KB_STORE));
  const sizeBytes = keys.reduce((sum, k) => sum + (localStorage.getItem(k)?.length ?? 0) * 2, 0);
  return { count: keys.length, sizeKb: Math.round(sizeBytes / 1024) };
}
