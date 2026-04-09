/**
 * Compliance Obligation Workflow
 *
 * CRITICAL RULES enforced in this file:
 * - Zero DB calls, zero network calls, no non-deterministic APIs
 * - All side effects through activities only
 * - Signal handlers are synchronous — they only mutate local variables
 * - No imports from @temporalio/activity, @temporalio/client, @temporalio/worker
 * - Only @temporalio/workflow imports allowed
 */
import {
  defineSignal,
  defineQuery,
  proxyActivities,
  setHandler,
  condition,
  log,
} from '@temporalio/workflow';

import type { AlertUrgency, AlertChannel } from '../../domain/types/alert';
import type { ObligationSnapshot } from '../../domain/types/obligation';
import type { WorkflowState } from '../../domain/types/workflow';
import type { WriteAuditInput } from '../../domain/types/audit';
import type { ObligationType } from '../../domain/types/obligation';

// ── Activity Interface ────────────────────────────────────────────────────────

/**
 * Typed interface for all activities used by this workflow.
 * proxyActivities is typed against this interface — no 'any'.
 */
interface ComplianceActivities {
  refreshObligationState(input: {
    obligationId: string;
  }): Promise<ObligationSnapshot>;

  createAlert(input: {
    obligationId: string;
    tenantId: string;
    urgency: AlertUrgency;
    channel: AlertChannel;
    dueDate: string;
  }): Promise<void>;

  writeAudit(input: WriteAuditInput): Promise<void>;

  sendEmail(input: {
    to: string;
    subject: string;
    body: string;
    alertId?: string;
  }): Promise<void>;

  sendSms(input: {
    to: string;
    message: string;
    alertId?: string;
  }): Promise<void>;
}

const activities = proxyActivities<ComplianceActivities>({
  startToCloseTimeout: '2m',
  retry: {
    maximumAttempts: 5,
  },
});

// ── Signals & Queries ─────────────────────────────────────────────────────────

export const forceRecheckSignal = defineSignal('forceRecheck');
export const markResolvedSignal = defineSignal('markResolved');
export const pauseMonitoringSignal = defineSignal('pauseMonitoring');
export const resumeMonitoringSignal = defineSignal('resumeMonitoring');

export const getStateQuery = defineQuery<WorkflowState>('getState');

// ── Workflow Input ────────────────────────────────────────────────────────────

export interface ComplianceObligationWorkflowInput {
  obligationId: string;
  tenantId: string;
  monitoredCompanyId: string;
  obligationType: ObligationType;
}

// ── Policy helpers (inlined — no external imports allowed in workflow) ─────────

interface InlineAlertPolicy {
  urgency: AlertUrgency;
  channels: AlertChannel[];
}

/**
 * Inline alert policy — mirrors obligation-policy.service.ts logic.
 * Must be inlined here because workflow code cannot import from non-workflow modules.
 */
function inlineGetAlertPolicy(
  daysRemaining: number,
): InlineAlertPolicy | null {
  if (daysRemaining > 30) return null;
  if (daysRemaining > 14) return { urgency: 'low', channels: ['email'] };
  if (daysRemaining > 7) return { urgency: 'medium', channels: ['email'] };
  return { urgency: 'urgent', channels: ['email', 'sms'] };
}

/**
 * Inline check interval — mirrors time.ts toTemporalDuration logic.
 */
function inlineGetCheckInterval(daysRemaining: number): string {
  if (daysRemaining > 30) return '14d';
  if (daysRemaining > 14) return '7d';
  if (daysRemaining > 7) return '3d';
  if (daysRemaining > 0) return '24h';
  return '6h';
}

// ── Workflow ──────────────────────────────────────────────────────────────────

const MAX_OVERDUE_ALERTS = 14;

export async function complianceObligationWorkflow(
  input: ComplianceObligationWorkflowInput,
): Promise<void> {
  const { obligationId, tenantId, obligationType } = input;

  // ── Local state (mutated synchronously by signal handlers) ──────────────────
  let paused = false;
  let resolved = false;
  let forceRecheck = false;
  let overdueAlertCount = 0;

  // ── Workflow state (returned by query handler) ───────────────────────────────
  const state: WorkflowState = {
    obligationId,
    obligationType,
    status: 'monitoring',
    dueDate: null,
    daysRemaining: null,
    paused: false,
    nextActionAt: null,
    lastExternalCheckAt: null,
    lastAlertAt: null,
    lastAlertUrgency: null,
  };

  // ── Signal handlers — MUST be synchronous, MUST NOT call activities ──────────

  setHandler(forceRecheckSignal, () => {
    log.info('[signal] forceRecheck received');
    forceRecheck = true;
  });

  setHandler(markResolvedSignal, () => {
    log.info('[signal] markResolved received');
    resolved = true;
    state.status = 'resolved';
  });

  setHandler(pauseMonitoringSignal, () => {
    log.info('[signal] pauseMonitoring received');
    paused = true;
    state.paused = true;
    state.status = 'paused';
  });

  setHandler(resumeMonitoringSignal, () => {
    log.info('[signal] resumeMonitoring received');
    paused = false;
    state.paused = false;
    state.status = 'monitoring';
  });

  // ── Query handler ────────────────────────────────────────────────────────────

  setHandler(getStateQuery, () => ({ ...state }));

  // ── Main monitoring loop ─────────────────────────────────────────────────────

  await activities.writeAudit({
    tenantId,
    entityType: 'compliance_obligation',
    entityId: obligationId,
    eventType: 'workflow_started',
    payload: { obligationType, monitoredCompanyId: input.monitoredCompanyId },
  });

  while (!resolved) {
    // ── 1. Handle paused state ─────────────────────────────────────────────────
    if (paused) {
      // Re-assert 'paused' status: a signal received mid-activity may have had
      // step 5 overwrite it before we looped back here.
      state.paused = true;
      state.status = 'paused';
      log.info('[workflow] Monitoring paused — waiting for resumeMonitoring signal');
      // Wait up to 30 days for resume; loop back to re-evaluate
      await condition(() => !paused, '30d');
      continue;
    }

    // ── 2. Fetch fresh obligation state from external source ───────────────────
    log.info('[workflow] Refreshing obligation state', { obligationId });
    const snapshot = await activities.refreshObligationState({ obligationId });

    const now = new Date();
    state.dueDate = snapshot.dueDate;
    state.daysRemaining = snapshot.daysRemaining;
    state.lastExternalCheckAt = now.toISOString();

    // ── 3. Check if the obligation is resolved ────────────────────────────────
    if (snapshot.resolved) {
      log.info('[workflow] Obligation resolved externally', { obligationId });
      state.status = 'resolved';
      resolved = true;

      await activities.writeAudit({
        tenantId,
        entityType: 'compliance_obligation',
        entityId: obligationId,
        eventType: 'obligation_resolved',
        payload: {
          dueDate: snapshot.dueDate,
          daysRemaining: snapshot.daysRemaining,
          checkedAt: snapshot.checkedAt,
          externalSnapshotId: snapshot.externalSnapshotId,
        },
      });
      break;
    }

    // ── 4. Handle force-recheck audit ─────────────────────────────────────────
    if (forceRecheck) {
      forceRecheck = false;
      await activities.writeAudit({
        tenantId,
        entityType: 'compliance_obligation',
        entityId: obligationId,
        eventType: 'force_recheck_executed',
        payload: {
          dueDate: snapshot.dueDate,
          daysRemaining: snapshot.daysRemaining,
          checkedAt: snapshot.checkedAt,
        },
      });
    }

    // ── 5. Update status based on days remaining ──────────────────────────────
    const daysRemaining = snapshot.daysRemaining;

    if (daysRemaining <= 0) {
      state.status = 'overdue';
    } else if (daysRemaining <= 7) {
      state.status = 'urgent';
    } else if (daysRemaining <= 14) {
      state.status = 'due_soon';
    } else {
      state.status = 'monitoring';
    }

    // ── 6. Alert policy ───────────────────────────────────────────────────────
    const policy = inlineGetAlertPolicy(daysRemaining);

    if (policy !== null) {
      // Safety cap: don't spam overdue alerts indefinitely
      const isOverdue = daysRemaining <= 0;
      const alertLimitReached = isOverdue && overdueAlertCount >= MAX_OVERDUE_ALERTS;

      if (!alertLimitReached) {
        log.info('[workflow] Triggering alerts', {
          urgency: policy.urgency,
          channels: policy.channels,
          daysRemaining,
        });

        for (const channel of policy.channels) {
          await activities.createAlert({
            obligationId,
            tenantId,
            urgency: policy.urgency,
            channel,
            dueDate: snapshot.dueDate,
          });
        }

        if (isOverdue) {
          overdueAlertCount++;
        }

        const alertNow = new Date();
        state.lastAlertAt = alertNow.toISOString();
        state.lastAlertUrgency = policy.urgency;

        // Compute approximate next action time for state tracking
        const waitStr = inlineGetCheckInterval(daysRemaining);
        const waitMs = parseDurationToMs(waitStr);
        state.nextActionAt = new Date(alertNow.getTime() + waitMs).toISOString();
      } else {
        log.warn('[workflow] Overdue alert limit reached — suppressing further alerts', {
          obligationId,
          overdueAlertCount,
        });
      }
    }

    // ── 7. Wait until next check interval or early wake via signal ────────────
    const waitDuration = inlineGetCheckInterval(daysRemaining);
    log.info('[workflow] Waiting for next check', { waitDuration, daysRemaining });

    await condition(
      () => forceRecheck || resolved || paused,
      waitDuration,
    );
  }

  // ── Workflow complete ──────────────────────────────────────────────────────
  await activities.writeAudit({
    tenantId,
    entityType: 'compliance_obligation',
    entityId: obligationId,
    eventType: 'workflow_completed',
    payload: {
      finalStatus: state.status,
      dueDate: state.dueDate,
      overdueAlertCount,
    },
  });

  log.info('[workflow] Completed', { obligationId, finalStatus: state.status });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse a simple duration string (e.g. '14d', '24h', '6h', '3d', '7d')
 * into milliseconds. Used only for computing state.nextActionAt — not for
 * actual workflow scheduling (Temporal handles that natively).
 */
function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)(d|h)$/);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  return 0;
}
