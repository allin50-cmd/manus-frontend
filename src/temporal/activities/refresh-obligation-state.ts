import { Context } from '@temporalio/activity';
import { getObligationById, updateObligationNextActionAt } from '../../repositories/obligation.repository';
import { db } from '../../db/client';
import { externalSourceSnapshots } from '../../db/schema';
import { daysUntil, toISODate, toTemporalDuration } from '../../lib/time';
import type { ObligationSnapshot } from '../../domain/types/obligation';

/**
 * Fetches the current state of a compliance obligation from the database
 * and records an external source snapshot.
 *
 * This is the "polling" activity — it runs on every workflow check cycle.
 * Companies House integration is a STUB; the snapshot records what we know.
 */
export async function refreshObligationState(input: {
  obligationId: string;
}): Promise<ObligationSnapshot> {
  const { obligationId } = input;

  const obligation = await getObligationById(obligationId);
  if (!obligation) {
    throw new Error(`Obligation not found: ${obligationId}`);
  }

  if (!obligation.dueDate) {
    throw new Error(
      `Obligation has no due date: ${obligationId}. Cannot compute daysRemaining.`,
    );
  }

  const daysRemaining = daysUntil(obligation.dueDate);
  const isResolved = obligation.status === 'resolved';
  const checkedAt = new Date();

  // Persist a snapshot record for audit / historical trending.
  const [snapshotRow] = await db
    .insert(externalSourceSnapshots)
    .values({
      obligationId,
      source: 'companies_house', // STUB — real CH API integration pending
      rawData: {
        stub: true,
        dueDate: obligation.dueDate,
        status: obligation.status,
        note: 'Snapshot populated from local DB; Companies House API not yet integrated',
      },
      dueDate: obligation.dueDate,
      resolved: isResolved,
      checkedAt,
    })
    .returning({ id: externalSourceSnapshots.id });

  // Update next_action_at on the obligation based on current daysRemaining.
  const durationStr = toTemporalDuration(daysRemaining);
  const durationMs = parseDurationToMs(durationStr);
  const nextActionAt = new Date(checkedAt.getTime() + durationMs);
  await updateObligationNextActionAt(obligationId, nextActionAt);

  Context.current().heartbeat({ obligationId, daysRemaining, checkedAt });

  return {
    dueDate: obligation.dueDate,
    daysRemaining,
    resolved: isResolved,
    checkedAt: checkedAt.toISOString(),
    externalSnapshotId: snapshotRow?.id,
  };
}

function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)(d|h)$/);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  return 0;
}
