const PREFIX = 'clerkos:cache:';
const MAX_AGE_MS = 24 * 60 * 60 * 1_000; // 24 hours

export function cacheWrite<T>(key: string, data: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // ignore storage quota exceeded
  }
}

export function cacheRead<T>(key: string): { data: T; ts: number; ageMs: number } | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: unknown; ts: number };
    const ageMs = Date.now() - parsed.ts;
    if (ageMs > MAX_AGE_MS) return null;
    return { data: parsed.data as T, ts: parsed.ts, ageMs };
  } catch {
    return null;
  }
}

export function formatCacheAge(ageMs: number): string {
  const minutes = Math.floor(ageMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
