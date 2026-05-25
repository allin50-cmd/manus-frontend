import { db } from '../db/index';
import type { IntakeForm } from '../db/schema';
import { monitoredCompanies } from '../db/schema';
import { writeAuditEvent } from '../trpc/db';
import { evaluateFineGuardActivation, type FineGuardEvaluation } from './fineguard-rules';
import { log } from './logger';
import { wrapGracefully } from './wrap-gracefully';

export interface FineGuardActivationInput {
  intake: IntakeForm;
  applicantName: string;
  sourceRef: string;
  pieExternalRef: string;
  correlationId: string;
  tenantId: string;
  /** Origin of this call — used to differentiate first-ingestion vs replay re-attempt in audit. */
  trigger: 'first_ingestion' | 'replay_retry';
}

export interface FineGuardActivationResult {
  evaluation: FineGuardEvaluation;
  activated: boolean;
  /** Identifies the monitored_companies row when upsert succeeded. */
  monitoredCompanyId: string | null;
  /** Captured for the caller; activation never re-throws. */
  error: Error | null;
}

const NO_OP_EVALUATION: FineGuardEvaluation = {
  activate: false,
  reasons: { pieOriginated: false, highUrgency: false, highValue: false },
};

/**
 * Best-effort FineGuard auto-activation for a PIE-originated intake.
 *
 * - Always writes `fineguard_activation_evaluated` audit.
 * - On `activate=true`: upserts `monitored_companies` then writes
 *   `fineguard_activation_triggered`.
 * - On upsert failure: writes `fineguard_activation_failed` so every
 *   `evaluate` event has a terminal counterpart.
 * - Never throws. Callers see the outcome via the returned result.
 *
 * Idempotent under replay: the `ON CONFLICT (company_number)` upsert keeps
 * `monitored_companies` at one row per sourceRef, so a replay path that
 * re-invokes this helper for a previously-failed activation will succeed
 * cleanly (and emit a `replay_retry` trigger event).
 */
export async function activateFineGuardForPie(
  input: FineGuardActivationInput,
): Promise<FineGuardActivationResult> {
  const { intake, applicantName, sourceRef, pieExternalRef, correlationId, tenantId, trigger } = input;

  let evaluation: FineGuardEvaluation;
  try {
    evaluation = evaluateFineGuardActivation(intake);
  } catch (evalErr) {
    log({
      level: 'error',
      event: 'pie.fineguard.evaluation_failed',
      correlationId,
      sourceRef,
      pieExternalRef,
      error: String(evalErr),
    });
    return {
      evaluation: NO_OP_EVALUATION,
      activated: false,
      monitoredCompanyId: null,
      error: evalErr instanceof Error ? evalErr : new Error(String(evalErr)),
    };
  }

  await writeAuditEvent({
    tenantId,
    entityType: 'intake',
    entityUuid: intake.id,
    action: 'fineguard_activation_evaluated',
    correlationId,
    metadata: JSON.stringify({
      sourceRef,
      upstreamSystem: 'PIE',
      pieExternalRef,
      matterRef: intake.matterRef,
      activate: evaluation.activate,
      reasons: evaluation.reasons,
      trigger,
    }),
  }).catch(e =>
    log({ level: 'error', event: 'vaultline.write.failed', correlationId, endpoint: 'pie-fineguard-eval', error: String(e) }),
  );

  log({
    level: 'info',
    event: 'pie.fineguard.evaluated',
    correlationId,
    sourceRef,
    pieExternalRef,
    activate: evaluation.activate,
    reasons: evaluation.reasons,
    trigger,
  });

  if (!evaluation.activate) {
    return { evaluation, activated: false, monitoredCompanyId: null, error: null };
  }

  const upsertResult = await wrapGracefully(
    {
      operation: 'pie.fineguard.upsert',
      dependency: 'fineguard_activation',
      correlationId,
      sourceRef,
      upstreamSystem: 'PIE',
      tenantId,
      entityUuid: intake.id,
      retryable: true,
    },
    async () => {
      const rows = await db
        .insert(monitoredCompanies)
        .values({
          companyNumber: sourceRef,
          companyName: applicantName,
          stripeSessionId: `pie-activation:${pieExternalRef}`,
        })
        .onConflictDoUpdate({
          target: monitoredCompanies.companyNumber,
          set: { companyName: applicantName },
        })
        .returning();
      const activation = rows[0];
      if (!activation) {
        // Defensive: RETURNING normally yields the conflicting row, but if a
        // future predicate filters it out we don't want a TypeError to leak.
        throw new Error('monitored_companies upsert returned no row');
      }
      return activation;
    },
  );

  if (upsertResult.ok) {
    const activation = upsertResult.value;
    await writeAuditEvent({
      tenantId,
      entityType: 'monitoring_activation',
      entityUuid: activation.id,
      action: 'fineguard_activation_triggered',
      correlationId,
      metadata: JSON.stringify({
        sourceRef,
        upstreamSystem: 'PIE',
        pieExternalRef,
        matterRef: intake.matterRef,
        companyIdentifier: sourceRef,
        companyName: applicantName,
        reasons: evaluation.reasons,
        trigger,
      }),
    }).catch(e =>
      log({ level: 'error', event: 'vaultline.write.failed', correlationId, endpoint: 'pie-fineguard-trigger', error: String(e) }),
    );

    log({
      level: 'info',
      event: 'pie.fineguard.activated',
      correlationId,
      sourceRef,
      pieExternalRef,
      companyIdentifier: sourceRef,
      reasons: evaluation.reasons,
      trigger,
    });

    return { evaluation, activated: true, monitoredCompanyId: activation.id, error: null };
  }

  // wrapGracefully already emitted the structured failure log and
  // system_failure_captured audit event. Additionally write the
  // domain-specific `fineguard_activation_failed` audit event so the
  // PIE intake's audit trail remains symmetric (evaluated → failed).
  await writeAuditEvent({
    tenantId,
    entityType: 'intake',
    entityUuid: intake.id,
    action: 'fineguard_activation_failed',
    correlationId,
    metadata: JSON.stringify({
      sourceRef,
      upstreamSystem: 'PIE',
      pieExternalRef,
      matterRef: intake.matterRef,
      reasons: evaluation.reasons,
      errorCategory: upsertResult.errorCategory,
      circuitState: upsertResult.circuitState,
      degradedMode: upsertResult.degraded,
      trigger,
    }),
  }).catch(e =>
    log({ level: 'error', event: 'vaultline.write.failed', correlationId, endpoint: 'pie-fineguard-failed', error: String(e) }),
  );

  return {
    evaluation,
    activated: false,
    monitoredCompanyId: null,
    error: new Error(upsertResult.error),
  };
}
