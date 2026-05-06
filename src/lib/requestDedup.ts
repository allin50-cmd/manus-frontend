type PendingRequest = {
  promise: Promise<unknown>;
  timer: ReturnType<typeof setTimeout>;
};

const pendingRequests = new Map<string, PendingRequest>();
const REQUEST_CACHE_TTL = 3000; // 3 seconds

export function dedupeRequest<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const existing = pendingRequests.get(key);
  if (existing) {
    clearTimeout(existing.timer);
    existing.timer = setTimeout(() => pendingRequests.delete(key), REQUEST_CACHE_TTL);
    return existing.promise as Promise<T>;
  }

  const promise = fn();
  const timer = setTimeout(() => pendingRequests.delete(key), REQUEST_CACHE_TTL);
  pendingRequests.set(key, { promise, timer });

  return promise;
}
