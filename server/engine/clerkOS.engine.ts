import { and, eq } from 'drizzle-orm';
import { bundles, cases, documents } from '../drizzle/schema';
import type { Case } from '../drizzle/schema';
import { writeAuditEvent } from '../trpc/db';
import type { DrizzleDb } from './types';

// ─── Type aliases ─────────────────────────────────────────────────────────────

export type CaseStatus = 'open' | 'in_progress' | 'closed' | 'on_hold';

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

// ─── State machine transition map ─────────────────────────────────────────────

const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  open:        ['in_progress', 'on_hold', 'closed'],
  in_progress: ['closed', 'on_hold', 'open'],
  on_hold:     ['open', 'in_progress', 'closed'],
  closed:      ['open'], // reopen
};

// ─── ClerkOS Engine ───────────────────────────────────────────────────────────

export class ClerkOSEngine {
  constructor(
    private readonly db: DrizzleDb,
    private readonly tenantId: string,
  ) {}

  // ─── Case transitions ───────────────────────────────────────────────────────

  async transitionCase(
    caseId: number,
    newStatus: CaseStatus,
    actorId: number,
    actorOpenId: string,
  ): Promise<Result<Case>> {
    // Fetch case scoped to this tenant
    const [existing] = await this.db
      .select()
      .from(cases)
      .where(and(eq(cases.id, caseId), eq(cases.tenantId, this.tenantId)))
      .limit(1);

    if (!existing) {
      return { ok: false, error: `Case ${caseId} not found` };
    }

    const currentStatus = existing.status as CaseStatus;
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];

    if (!allowed.includes(newStatus)) {
      return {
        ok: false,
        error: `Transition ${currentStatus} → ${newStatus} is not permitted`,
      };
    }

    const [updated] = await this.db
      .update(cases)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(and(eq(cases.id, caseId), eq(cases.tenantId, this.tenantId)))
      .returning();

    await writeAuditEvent({
      tenantId: this.tenantId,
      entityType: 'case',
      entityId: caseId,
      action: `transition:${currentStatus}→${newStatus}`,
      actorId,
      actorOpenId,
      previousState: JSON.stringify({ status: currentStatus }),
      nextState: JSON.stringify({ status: newStatus }),
    });

    return { ok: true, value: updated };
  }

  // ─── Bundle eligibility ─────────────────────────────────────────────────────

  async canGenerateBundle(caseId: number): Promise<{ eligible: boolean; reason?: string }> {
    const [caseRow] = await this.db
      .select()
      .from(cases)
      .where(and(eq(cases.id, caseId), eq(cases.tenantId, this.tenantId)))
      .limit(1);

    if (!caseRow) return { eligible: false, reason: 'Case not found' };

    if (caseRow.status === 'on_hold') {
      return { eligible: false, reason: 'Case is on hold — resolve before generating bundle' };
    }

    // Must have at least one document approved for bundle
    const docs = await this.db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.caseId, caseId),
          eq(documents.tenantId, this.tenantId),
          eq(documents.approvedForBundle, 1),
        ),
      );

    if (docs.length === 0) {
      return {
        eligible: false,
        reason: 'No documents approved for bundle — approve at least one document first',
      };
    }

    return { eligible: true };
  }

  // ─── Validate allocation assignment ─────────────────────────────────────────

  async validateAllocationAssignment(caseId: number, clerkId: number): Promise<Result<true>> {
    const [caseRow] = await this.db
      .select()
      .from(cases)
      .where(and(eq(cases.id, caseId), eq(cases.tenantId, this.tenantId)))
      .limit(1);

    if (!caseRow) return { ok: false, error: 'Case not found' };
    if (caseRow.status === 'closed') {
      return { ok: false, error: 'Cannot allocate tasks to a closed case' };
    }

    return { ok: true, value: true };
  }

  // ─── Create bundle record ───────────────────────────────────────────────────

  async initiateBundle(
    caseId: number,
    actorId: number,
    actorOpenId: string,
  ): Promise<Result<{ bundleId: number; orchestrationId: string }>> {
    const eligibility = await this.canGenerateBundle(caseId);
    if (!eligibility.eligible) {
      return { ok: false, error: eligibility.reason ?? 'Not eligible for bundle generation' };
    }

    const orchestrationId = `bundle-${this.tenantId}-${caseId}-${Date.now()}`;

    const [bundle] = await this.db
      .insert(bundles)
      .values({
        tenantId: this.tenantId,
        caseId,
        status: 'pending',
        orchestrationId,
      })
      .returning();

    await writeAuditEvent({
      tenantId: this.tenantId,
      entityType: 'bundle',
      entityId: bundle.id,
      action: 'initiate',
      actorId,
      actorOpenId,
      nextState: JSON.stringify({ caseId, orchestrationId }),
    });

    return { ok: true, value: { bundleId: bundle.id, orchestrationId } };
  }
}
