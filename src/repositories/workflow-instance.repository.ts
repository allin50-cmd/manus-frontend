import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { workflowInstances } from '../db/schema';
import type { WorkflowInstance, WorkflowStatus } from '../domain/types/workflow';

export interface InsertWorkflowInstanceInput {
  tenantId: string;
  obligationId: string;
  workflowId: string;
  taskQueue: string;
}

function rowToWorkflowInstance(
  row: typeof workflowInstances.$inferSelect,
): WorkflowInstance {
  return {
    id: row.id,
    tenantId: row.tenantId,
    obligationId: row.obligationId,
    workflowId: row.workflowId,
    taskQueue: row.taskQueue,
    status: row.status as WorkflowStatus,
    startedAt: row.startedAt,
    completedAt: row.completedAt ?? null,
    createdAt: row.createdAt,
  };
}

export async function insertWorkflowInstance(
  data: InsertWorkflowInstanceInput,
): Promise<{ id: string }> {
  const [row] = await db
    .insert(workflowInstances)
    .values({
      tenantId: data.tenantId,
      obligationId: data.obligationId,
      workflowId: data.workflowId,
      taskQueue: data.taskQueue,
      status: 'running',
    })
    .returning({ id: workflowInstances.id });

  if (!row) {
    throw new Error('Failed to insert workflow instance');
  }
  return { id: row.id };
}

export async function updateWorkflowInstanceStatus(
  workflowId: string,
  status: WorkflowStatus,
  completedAt?: Date,
): Promise<void> {
  await db
    .update(workflowInstances)
    .set({
      status,
      ...(completedAt ? { completedAt } : {}),
    })
    .where(eq(workflowInstances.workflowId, workflowId));
}

export async function getWorkflowInstanceByObligationId(
  obligationId: string,
): Promise<WorkflowInstance | null> {
  const [row] = await db
    .select()
    .from(workflowInstances)
    .where(eq(workflowInstances.obligationId, obligationId))
    .limit(1);

  return row ? rowToWorkflowInstance(row) : null;
}
