import { log } from './logger';

interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  label?: string;
  correlationId?: string;
}

/**
 * Retries an async operation with linear back-off.
 * Throws the last error if all attempts are exhausted.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const { attempts = 3, baseDelayMs = 500, label = 'operation', correlationId } = opts;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isLast = attempt === attempts;
      log({
        level: isLast ? 'error' : 'warn',
        event: isLast ? `${label}: all attempts failed` : `${label}: attempt ${attempt} failed, retrying`,
        correlationId,
        attempt,
        error: err instanceof Error ? err.message : String(err),
      });
      if (!isLast) {
        await new Promise(r => setTimeout(r, baseDelayMs * attempt));
      }
    }
  }

  throw lastError;
}
