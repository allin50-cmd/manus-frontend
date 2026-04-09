import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { complianceObligations } from '../db/schema';
import type { Obligation, ObligationStatus, ObligationType } from '../domain/types/obligation';

export interface InsertObligationInput {
  tenantId: string;
  monitoredCompanyId: string;
  obligationType: ObligationType;
  status?: ObligationStatus;
  dueDate?: string | null;
}

function rowToObligation(row: typeof complianceObligations.$inferSelect): Obligation {
  return {
    id: row.id,
    tenantId: row.tenantId,
    monitoredCompanyId: row.monitoredCompanyId,
    obligationType: row.obligationType as ObligationType,
    status: row.status as ObligationStatus,
    dueDate: row.dueDate ?? null,
    nextActionAt: row.nextActionAt ?? null,
    workflowId: row.workflowId ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Upsert: insert or return existing obligation for (company, type).
 * The unique index co_company_type_uniq enforces at-most-one per pair.
 * Safe under concurrent/retried activation — won't create duplicates.
 */
export async function insertObligation(
  data: InsertObligationInput,
): Promise<{ id: string }> {
  const [row] = await db
    .insert(complianceObligations)
    .values({
      tenantId: data.tenantId,
      monitoredCompanyId: data.monitoredCompanyId,
      obligationType: data.obligationType,
      status: data.status ?? 'pending',
      dueDate: data.dueDate ?? null,
    })
    .onConflictDoUpdate({
      target: [complianceObligations.monitoredCompanyId, complianceObligations.obligationType],
      set: {
        // Keep existing status/dueDate unchanged — only refresh updatedAt
        updatedAt: new Date(),
      },
    })
    .returning({ id: complianceObligations.id });

  if (!row) {
    throw new Error('Failed to upsert obligation');
  }
  return { id: row.id };
}

export async function getObligationById(
  id: string,
): Promise<Obligation | null> {
  const [row] = await db
    .select()
    .from(complianceObligations)
    .where(eq(complianceObligations.id, id))
    .limit(1);

  return row ? rowToObligation(row) : null;
}

export async function listObligationsByCompany(
  monitoredCompanyId: string,
): Promise<Obligation[]> {
  const rows = await db
    .select()
    .from(complianceObligations)
    .where(eq(complianceObligations.monitoredCompanyId, monitoredCompanyId));

  return rows.map(rowToObligation);
}

export async function updateObligationStatus(
  id: string,
  status: ObligationStatus,
): Promise<void> {
  await db
    .update(complianceObligations)
    .set({ status, updatedAt: new Date() })
    .where(eq(complianceObligations.id, id));
}

export async function updateObligationWorkflowId(
  id: string,
  workflowId: string,
): Promise<void> {
  await db
    .update(complianceObligations)
    .set({ workflowId, updatedAt: new Date() })
    .where(eq(complianceObligations.id, id));
}

export async function updateObligationNextActionAt(
  id: string,
  nextActionAt: Date,
): Promise<void> {
  await db
    .update(complianceObligations)
    .set({ nextActionAt, updatedAt: new Date() })
    .where(eq(complianceObligations.id, id));
}
