/**
 * In-memory circuit breaker for external dependencies.
 *
 * Serverless note: state is per-process. Each cold start resets all
 * circuits. With N concurrent Vercel functions, each maintains its own
 * view — this is intentional. No Redis, no shared state, no persistence.
 *
 * The breaker is advisory: it short-circuits calls under sustained
 * dependency degradation to reduce wasted timeouts and fan-out, but it
 * does NOT replace per-call error handling. Callers still wrap dependent
 * calls in try/catch (or wrapGracefully) and treat circuit_open as one
 * more failure mode among others.
 */

export type CircuitStateName = 'closed' | 'open' | 'half-open';

export interface CircuitState {
  failures: number;
  lastFailureAt: number;
  state: CircuitStateName;
  openedAt: number;
}

export interface CircuitSnapshot {
  state: CircuitStateName;
  failures: number;
  cooldownRemainingMs: number;
}

export interface CircuitSnapshotDetailed extends CircuitSnapshot {
  lastFailureAt: number;
  openedAt: number;
}

export interface CircuitConfig {
  /** Failures within `windowMs` that open the circuit. */
  failureThreshold: number;
  /** Sliding window for counting recent failures. */
  windowMs: number;
  /** Time the circuit stays OPEN before allowing a single probe (HALF-OPEN). */
  cooldownMs: number;
}

const DEFAULT_CONFIG: CircuitConfig = {
  failureThreshold: 5,
  windowMs: 60_000,
  cooldownMs: 30_000,
};

const configs = new Map<string, CircuitConfig>();
const states = new Map<string, CircuitState>();

function freshState(): CircuitState {
  return { failures: 0, lastFailureAt: 0, state: 'closed', openedAt: 0 };
}

function getConfig(dependency: string): CircuitConfig {
  return configs.get(dependency) ?? DEFAULT_CONFIG;
}

function getOrCreateState(dependency: string): CircuitState {
  let state = states.get(dependency);
  if (!state) {
    state = freshState();
    states.set(dependency, state);
  }
  return state;
}

/**
 * Override the default config for a single dependency. Useful for tests
 * or for tuning a particularly noisy/slow upstream.
 */
export function configureDependency(dependency: string, config: Partial<CircuitConfig>): void {
  configs.set(dependency, { ...DEFAULT_CONFIG, ...getConfig(dependency), ...config });
}

/**
 * Returns true if the caller may execute against this dependency. When the
 * circuit is OPEN, returns false until the cooldown elapses — at which
 * point the circuit transitions to HALF-OPEN and ALLOWS ONE probe call.
 * If that probe fails (recordFailure), the circuit re-opens.
 */
export function shouldAllowExecution(dependency: string, now: number = Date.now()): boolean {
  const state = getOrCreateState(dependency);
  const config = getConfig(dependency);

  if (state.state === 'open') {
    if (now - state.openedAt >= config.cooldownMs) {
      // Cooldown elapsed — let one probe through.
      state.state = 'half-open';
      return true;
    }
    return false;
  }

  // closed or half-open — execution permitted.
  return true;
}

export function recordSuccess(dependency: string): void {
  const state = getOrCreateState(dependency);
  // Any success closes the circuit and resets the failure counter.
  // This is intentionally aggressive — a single working call is enough
  // signal to assume recovery.
  state.failures = 0;
  state.lastFailureAt = 0;
  state.state = 'closed';
  state.openedAt = 0;
}

export function recordFailure(dependency: string, now: number = Date.now()): void {
  const state = getOrCreateState(dependency);
  const config = getConfig(dependency);

  if (state.state === 'half-open') {
    // Probe failed — re-open with reset window timing.
    state.state = 'open';
    state.openedAt = now;
    state.lastFailureAt = now;
    state.failures += 1;
    return;
  }

  // Sliding-window reset: failures older than windowMs don't count.
  if (state.lastFailureAt > 0 && now - state.lastFailureAt > config.windowMs) {
    state.failures = 0;
  }

  state.failures += 1;
  state.lastFailureAt = now;

  if (state.failures >= config.failureThreshold) {
    state.state = 'open';
    state.openedAt = now;
  }
}

export function getCircuitSnapshot(dependency: string, now: number = Date.now()): CircuitSnapshot {
  const state = getOrCreateState(dependency);
  const config = getConfig(dependency);
  let cooldownRemainingMs = 0;
  if (state.state === 'open') {
    cooldownRemainingMs = Math.max(0, config.cooldownMs - (now - state.openedAt));
  }
  return {
    state: state.state,
    failures: state.failures,
    cooldownRemainingMs,
  };
}

/**
 * Read-only snapshot of every known dependency's circuit state. Used by
 * the resilience observability endpoint. Returns a fresh object on each
 * call — callers may not mutate internal state through it.
 */
export function getAllCircuitSnapshots(
  now: number = Date.now(),
): Record<string, CircuitSnapshotDetailed> {
  const out: Record<string, CircuitSnapshotDetailed> = {};
  for (const [dep, state] of states) {
    const config = getConfig(dep);
    let cooldownRemainingMs = 0;
    if (state.state === 'open') {
      cooldownRemainingMs = Math.max(0, config.cooldownMs - (now - state.openedAt));
    }
    out[dep] = {
      state: state.state,
      failures: state.failures,
      cooldownRemainingMs,
      lastFailureAt: state.lastFailureAt,
      openedAt: state.openedAt,
    };
  }
  return out;
}

/**
 * Open a circuit directly for a given remaining cooldown duration.
 *
 * Used by global-circuit-sync when reconciling a remotely-open circuit.
 * Does NOT mutate the dependency's failureThreshold — the existing config
 * is preserved so future organic failures still use the correct threshold.
 *
 * The openedAt timestamp is back-dated so that shouldAllowExecution sees
 * exactly `remainingCooldownMs` left in the cooldown window.
 */
export function forceCircuitOpen(
  dependency: string,
  remainingCooldownMs: number,
  now: number = Date.now(),
): void {
  const state = getOrCreateState(dependency);
  const config = getConfig(dependency);
  state.state = 'open';
  // Back-date openedAt so the remaining cooldown equals remainingCooldownMs.
  state.openedAt = now - Math.max(0, config.cooldownMs - remainingCooldownMs);
  if (state.failures < 1) state.failures = 1;
  state.lastFailureAt = now;
}

/**
 * Reset all circuit state and configs. Test-only helper — production code
 * relies on cold-start reset, never an explicit reset.
 */
export function __resetCircuitBreakerForTests(): void {
  states.clear();
  configs.clear();
}
