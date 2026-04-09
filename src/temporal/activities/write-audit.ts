import { insertAuditRecord } from '../../repositories/audit.repository';
import type { WriteAuditInput } from '../../domain/types/audit';

/**
 * Persist an audit record to the database.
 * Called from within the compliance obligation workflow.
 */
export async function writeAudit(input: WriteAuditInput): Promise<void> {
  await insertAuditRecord(input);
}
