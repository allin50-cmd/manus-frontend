import { eq } from 'drizzle-orm';
import type { ClerkAllocation } from '../drizzle/schema';
import { clerkAllocations } from '../drizzle/schema';
import { getDb, writeAuditEvent } from '../trpc/db';
import { ServiceBusClient } from '../services/serviceBus';
import { ClerkOSEngine } from './clerkOS.engine';

// ─── Queue item payload sent via Service Bus ──────────────────────────────────

export type QueueItemPayload = {
  type: 'bundle_generate' | 'case_transition' | 'allocation_escalate';
  tenantId: string;
  caseId: number;
  actorId: number;
  actorOpenId: string;
  // type-specific fields
  targetStatus?: string;
  bundleId?: number;
  allocationId?: number;
};

// ─── SystemSpine ──────────────────────────────────────────────────────────────

export class SystemSpine {
  /**
   * Central dispatcher — called by the Service Bus consumer or directly
   * in test/development when the queue is unavailable.
   */
  async handleQueueItem(payload: QueueItemPayload): Promise<void> {
    const db = await getDb();
    if (!db) {
      console.warn('[SystemSpine] Database not available — skipping queue item');
      return;
    }

    // Always create the engine scoped to the tenant
    const engine = new ClerkOSEngine(db, payload.tenantId);

    switch (payload.type) {
      case 'bundle_generate':
        await this.handleBundleGenerate(engine, payload);
        break;

      case 'case_transition':
        await this.handleCaseTransition(engine, payload);
        break;

      case 'allocation_escalate':
        await this.handleAllocationEscalation(db, payload);
        break;

      default:
        console.warn('[SystemSpine] Unknown queue item type:', (payload as any).type);
    }
  }

  // ─── Bundle generation ──────────────────────────────────────────────────────

  private async handleBundleGenerate(
    engine: ClerkOSEngine,
    payload: QueueItemPayload,
  ): Promise<void> {
    const result = await engine.initiateBundle(
      payload.caseId,
      payload.actorId,
      payload.actorOpenId,
    );

    if (!result.ok) {
      console.error('[SystemSpine] Bundle initiation failed:', result.error);
      return;
    }

    // Enqueue to Azure Service Bus for Durable Functions processing
    await ServiceBusClient.send('clerkos-bundles', {
      bundleId: result.value.bundleId,
      orchestrationId: result.value.orchestrationId,
      tenantId: payload.tenantId,
      caseId: payload.caseId,
    });

    console.log(
      `[SystemSpine] Bundle ${result.value.bundleId} queued for orchestration (${result.value.orchestrationId})`,
    );
  }

  // ─── Case transition ────────────────────────────────────────────────────────

  private async handleCaseTransition(
    engine: ClerkOSEngine,
    payload: QueueItemPayload,
  ): Promise<void> {
    if (!payload.targetStatus) return;

    const result = await engine.transitionCase(
      payload.caseId,
      payload.targetStatus as any,
      payload.actorId,
      payload.actorOpenId,
    );

    if (!result.ok) {
      console.error('[SystemSpine] Case transition failed:', result.error);
    }
  }

  // ─── Allocation escalation ──────────────────────────────────────────────────

  private async handleAllocationEscalation(
    db: Awaited<ReturnType<typeof getDb>>,
    payload: QueueItemPayload,
  ): Promise<void> {
    if (!db || !payload.allocationId) return;

    const [allocation] = await db
      .select()
      .from(clerkAllocations)
      .where(eq(clerkAllocations.id, payload.allocationId))
      .limit(1);

    if (!allocation || allocation.tenantId !== payload.tenantId) return;

    // Escalate: bump priority to 'urgent' if overdue
    const today = new Date().toISOString().split('T')[0];
    if (allocation.dueDate && allocation.dueDate < today && allocation.priority !== 'urgent') {
      await db
        .update(clerkAllocations)
        .set({ priority: 'urgent', updatedAt: new Date() })
        .where(eq(clerkAllocations.id, payload.allocationId));

      await writeAuditEvent({
        tenantId: payload.tenantId,
        entityType: 'allocation',
        entityId: payload.allocationId,
        action: 'escalate:urgent',
        actorId: payload.actorId,
        actorOpenId: payload.actorOpenId,
        metadata: JSON.stringify({ reason: 'overdue', dueDate: allocation.dueDate }),
      });
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const systemSpine = new SystemSpine();
