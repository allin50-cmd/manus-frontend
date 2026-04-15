import { db } from '../db';
import { dispatchedNotifications } from '../db/schema';

/**
 * Insert a dispatch record only if it does not already exist (idempotent).
 *
 * Returns `true` when the row was inserted (notification is new),
 * `false` when a matching dedupeKey was already present (duplicate — skip).
 */
export async function insertDispatchIfNew(
  dedupeKey: string,
  data: {
    companyNumber: string;
    alertType: string;
    dueDate: string;
    windowDays: number;
  },
): Promise<boolean> {
  const rows = await db
    .insert(dispatchedNotifications)
    .values({ dedupeKey, ...data })
    .onConflictDoNothing({ target: dispatchedNotifications.dedupeKey })
    .returning({ id: dispatchedNotifications.id });

  return rows.length > 0;
}
