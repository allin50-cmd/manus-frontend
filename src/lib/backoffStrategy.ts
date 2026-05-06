export interface BackoffConfig {
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
  maxAttempts: number;
  jitterFactor: number;
}

const DEFAULT_CONFIG: BackoffConfig = {
  initialDelayMs: 500,
  maxDelayMs: 30000,
  multiplier: 2,
  maxAttempts: 5,
  jitterFactor: 0.1,
};

export function calculateBackoff(
  attempt: number,
  config: Partial<BackoffConfig> = {},
): number {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (attempt >= cfg.maxAttempts) {
    return cfg.maxDelayMs;
  }

  const exponentialDelay = cfg.initialDelayMs * Math.pow(cfg.multiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, cfg.maxDelayMs);
  const jitter = cappedDelay * cfg.jitterFactor * Math.random();

  return Math.round(cappedDelay + jitter);
}

export function getRetryInfo(attempt: number, config: Partial<BackoffConfig> = {}): {
  nextRetryMs: number;
  totalAttempts: number;
  isMaxed: boolean;
  estimatedSeconds: number;
} {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const nextRetryMs = calculateBackoff(attempt, cfg);
  const isMaxed = attempt >= cfg.maxAttempts;

  return {
    nextRetryMs,
    totalAttempts: cfg.maxAttempts,
    isMaxed,
    estimatedSeconds: Math.round(nextRetryMs / 1000),
  };
}
