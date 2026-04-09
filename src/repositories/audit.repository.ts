import { db } from '../db/client';
import { auditRecords } from '../db/schema';
import type { WriteAuditInput } from '../domain/types/audit';

/**
 * Persist an immutable audit record.
 * Never throws on conflict — audit records are append-only.
 */
export async function insertAuditRecord(data: WriteAuditInput): Promise<void> {
  await db.insert(auditRecords).values({
    tenantId: data.tenantId,
    entityType: data.entityType,
    entityId: data.entityId,
    eventType: data.eventType,
    payload: data.payload,
  });
}
