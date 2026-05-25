import { writeAuditEvent } from '../trpc/db';
import {
  getCircuitSnapshot,
  recordFailure,
  recordSuccess,
  shouldAllowExecution,
  type CircuitStateName,
} from './circuit-breaker';
import { log } from './logger';
import { recordOperationFailure, recordOperationSuccess } from './resilience-stats';

/**
 * Coarse error category surfaced in audit metadata. Operators use this
 * to triage failure spikes: "is it bad input, a dependency outage, or
 * us?"
 */
export type ErrorCategory =
  | 'validation'
  | 'external_api'
  | 'database'
  | 'runtime'
  | 'circuit_open';

export interface WrapContext {
  /** Free-form name of the logical operation — used in logs and audit. */
  operation: string;
  /**
   * Name of the external dependency (if any). Presence enables circuit
   * breaker checks and recordSuccess/recordFailure bookkeeping.
   * Conventional names:
   *   - 'companies_house_api'
   *   - 'stripe_webhook_processing'
   *   - 'fineguard_activation'
   */
  dependency?: string;
  /** Coarse error category for audit metadata when fn throws (non-circuit). */
  errorCategory?: ErrorCategory;
  /** Whether the caller considers retry sensible. Stored in audit metadata. */
  retryable?: boolean;
  correlationId?: string;
  sourceRef?: string;
  entityUuid?: string;
  upstreamSystem?: string;
  /** If supplied, system_failure_captured audit event is written on failure. */
  tenantId?: string;
}

export type WrapResult<T> =
  | {
      ok: true;
      value: T;
      circuitState: CircuitStateName;
      degraded: false;
    }
  | {
      ok: false;
      error: string;
      circuitState: CircuitStateName;
      degraded: boolean;
      errorCategory: ErrorCategory;
    };

/**
 * Wrap an async operation so failures NEVER throw.
 *
 * Guarantees:
 *   - Returns a structured WrapResult, never throws.
 *   - When `dependency` is present, checks the circuit breaker first; if
 *     OPEN within cooldown, returns ok:false / error:'circuit_open' without
 *     invoking fn.
 *   - On success: records success against the breaker.
 *   - On failure: records failure, emits structured log, and (if
 *     tenantId is provided) writes a `system_failure_captured` audit
 *     event with circuit metadata.
 *
 * The audit write itself can fail — that failure is caught and logged
 * as `vaultline.write.failed`, never thrown.
 */
export async function wrapGracefully<T>(
  ctx: WrapContext,
  fn: () => Promise<T>,
): Promise<WrapResult<T>> {
  const { operation, dependency, correlationId, sourceRef, upstreamSystem, tenantId, entityUuid } = ctx;
  const now = Date.now();

  // Circuit breaker fast-fail
  if (dependency && !shouldAllowExecution(dependency, now)) {
    const snap = getCircuitSnapshot(dependency, now);
    recordOperationFailure(dependency, { correlationId, operation, outcome: 'circuit_open' }, now);
    log({
      level: 'warn',
      event: 'graceful.circuit_open.skip',
      operation,
      dependency,
      correlationId,
      sourceRef,
      circuitState: snap.state,
      failureCount: snap.failures,
      cooldownRemainingMs: snap.cooldownRemainingMs,
    });
    if (tenantId && entityUuid) {
      await emitFailureAudit({
        tenantId,
        entityUuid,
        operation,
        dependency,
        correlationId,
        sourceRef,
        upstreamSystem,
        error: 'circuit_open',
        errorCategory: 'circuit_open',
        retryable: false,
        snap,
        degradedMode: true,
      });
    }
    return {
      ok: false,
      error: 'circuit_open',
      circuitState: snap.state,
      degraded: true,
      errorCategory: 'circuit_open',
    };
  }

  try {
    const value = await fn();
    if (dependency) recordSuccess(dependency);
    recordOperationSuccess(dependency, { correlationId, operation });
    const snap = dependency
      ? getCircuitSnapshot(dependency)
      : { state: 'closed' as const, failures: 0, cooldownRemainingMs: 0 };
    return { ok: true, value, circuitState: snap.state, degraded: false };
  } catch (err) {
    if (dependency) recordFailure(dependency, now);
    recordOperationFailure(dependency, { correlationId, operation });
    const snap = dependency
      ? getCircuitSnapshot(dependency)
      : { state: 'closed' as const, failures: 0, cooldownRemainingMs: 0 };

    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorCategory = ctx.errorCategory ?? inferCategory(err);

    log({
      level: 'error',
      event: 'graceful.operation_failed',
      operation,
      dependency,
      correlationId,
      sourceRef,
      circuitState: snap.state,
      failureCount: snap.failures,
      cooldownRemainingMs: snap.cooldownRemainingMs,
      errorCategory,
      error: errorMessage,
    });

    if (tenantId && entityUuid) {
      await emitFailureAudit({
        tenantId,
        entityUuid,
        operation,
        dependency,
        correlationId,
        sourceRef,
        upstreamSystem,
        error: errorMessage,
        errorCategory,
        retryable: ctx.retryable ?? defaultRetryable(errorCategory),
        snap,
        degradedMode: snap.state !== 'closed',
      });
    }

    return {
      ok: false,
      error: errorMessage,
      circuitState: snap.state,
      degraded: snap.state !== 'closed',
      errorCategory,
    };
  }
}

interface FailureAuditInput {
  tenantId: string;
  entityUuid: string;
  operation: string;
  dependency?: string;
  correlationId?: string;
  sourceRef?: string;
  upstreamSystem?: string;
  error: string;
  errorCategory: ErrorCategory;
  retryable: boolean;
  snap: { state: CircuitStateName; failures: number; cooldownRemainingMs: number };
  degradedMode: boolean;
}

async function emitFailureAudit(input: FailureAuditInput): Promise<void> {
  await writeAuditEvent({
    tenantId: input.tenantId,
    entityType: 'system',
    entityUuid: input.entityUuid,
    action: 'system_failure_captured',
    correlationId: input.correlationId ?? 'unknown',
    metadata: JSON.stringify({
      operation: input.operation,
      dependency: input.dependency ?? null,
      sourceRef: input.sourceRef ?? null,
      upstreamSystem: input.upstreamSystem ?? null,
      error: input.error,
      errorCategory: input.errorCategory,
      retryable: input.retryable,
      circuitState: input.snap.state,
      failureCount: input.snap.failures,
      cooldownRemainingMs: input.snap.cooldownRemainingMs,
      degradedMode: input.degradedMode,
    }),
  }).catch(e =>
    log({
      level: 'error',
      event: 'vaultline.write.failed',
      correlationId: input.correlationId,
      endpoint: 'system_failure_captured',
      error: String(e),
    }),
  );
}

function inferCategory(err: unknown): ErrorCategory {
  const msg = err instanceof Error ? err.message : String(err);
  if (/value too long|violates|duplicate key|relation .* does not exist|column .* does not exist/i.test(msg)) {
    return 'database';
  }
  if (/timeout|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|fetch failed|network|status (5|429|408)/i.test(msg)) {
    return 'external_api';
  }
  if (/required|invalid|expected|zod/i.test(msg)) {
    return 'validation';
  }
  return 'runtime';
}

function defaultRetryable(category: ErrorCategory): boolean {
  switch (category) {
    case 'external_api':
      return true;
    case 'database':
      return true; // transient pool/connection issues
    case 'circuit_open':
      return true; // by definition retry after cooldown
    case 'validation':
      return false;
    case 'runtime':
      return false;
  }
}
