import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { alerts } from '../db/schema';
import type { Alert, AlertStatus, AlertUrgency, AlertChannel } from '../domain/types/alert';

export interface InsertAlertInput {
  tenantId: string;
  obligationId: string;
  urgency: AlertUrgency;
  channel: AlertChannel;
  dedupeKey: string;
  dueDate: string;
}

function rowToAlert(row: typeof alerts.$inferSelect): Alert {
  return {
    id: row.id,
    tenantId: row.tenantId,
    obligationId: row.obligationId,
    urgency: row.urgency as AlertUrgency,
    channel: row.channel as AlertChannel,
    status: row.status as AlertStatus,
    dedupeKey: row.dedupeKey,
    dueDate: row.dueDate,
    createdAt: row.createdAt,
    sentAt: row.sentAt ?? null,
  };
}

/**
 * Insert a new alert record only if the dedupeKey is not already present.
 * Returns the inserted row's id, or null if deduplicated (conflict on dedupeKey).
 */
export async function insertAlertIfNew(
  data: InsertAlertInput,
): Promise<{ id: string } | null> {
  const rows = await db
    .insert(alerts)
    .values({
      tenantId: data.tenantId,
      obligationId: data.obligationId,
      urgency: data.urgency,
      channel: data.channel,
      dedupeKey: data.dedupeKey,
      dueDate: data.dueDate,
      status: 'queued',
    })
    .onConflictDoNothing({ target: alerts.dedupeKey })
    .returning({ id: alerts.id });

  if (!rows || rows.length === 0) {
    return null; // deduplicated
  }
  return { id: rows[0].id };
}

export async function getAlertsByObligation(
  obligationId: string,
): Promise<Alert[]> {
  const rows = await db
    .select()
    .from(alerts)
    .where(eq(alerts.obligationId, obligationId));

  return rows.map(rowToAlert);
}

export async function updateAlertStatus(
  id: string,
  status: AlertStatus,
): Promise<void> {
  const sentAt = status === 'sent' ? new Date() : undefined;
  await db
    .update(alerts)
    .set({ status, ...(sentAt ? { sentAt } : {}) })
    .where(eq(alerts.id, id));
}
