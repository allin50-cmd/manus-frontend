/**
 * In-memory sliding window rate limiter.
 * Module-scoped — state persists across requests within the same process.
 */

const windows = new Map<string, number[]>();

/**
 * Returns true if the key has exceeded maxReqs within the last windowMs milliseconds.
 * Side effect: records the current hit if not limited.
 */
export function isRateLimited(
  key: string,
  maxReqs: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (windows.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= maxReqs) {
    windows.set(key, hits);
    return true;
  }

  hits.push(now);
  windows.set(key, hits);
  return false;
}

/** Get the IP address from a Next.js request, with proxy fallback. */
export function getClientIp(req: Request): string {
  const forwarded = (req.headers as Headers).get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}
