import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { clerkAllocations } from '../../drizzle/schema';
import { adminProcedure, tenantProcedure, router } from '../_core/trpc';
import { getAllocationsByClerk, getDb, getPendingAllocations, writeAuditEvent } from '../db';
import { ClerkOSEngine } from '../../engine/clerkOS.engine';

// In-process idempotency store: key → committed result
// Survives the lifetime of the server process; prevents double-allocation on retry.
const idempotencyStore = new Map<string, unknown>();

const priorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
const statusEnum = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

export const allocationsRouter = router({
  create: adminProcedure
    .input(
      z.object({
        clerkId: z.number(),
        caseId: z.number(),
        taskType: z.string().min(1),
        priority: priorityEnum.optional().default('medium'),
        dueDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
          .optional(),
        notes: z.string().optional(),
        idempotencyKey: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Exactly-once: return cached result if this key was already committed
      if (input.idempotencyKey) {
        const storeKey = `${ctx.tenantId}:${input.idempotencyKey}`;
        const cached = idempotencyStore.get(storeKey);
        if (cached) return cached;
      }

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Engine validates case eligibility before allocating
      const engine = new ClerkOSEngine(db, ctx.tenantId);
      const validation = await engine.validateAllocationAssignment(input.caseId, input.clerkId);
      if (validation.ok === false) throw new Error(validation.error);

      const [created] = await db
        .insert(clerkAllocations)
        .values({
          tenantId: ctx.tenantId,
          caseId: input.caseId,
          clerkId: input.clerkId,
          taskType: input.taskType,
          priority: input.priority,
          dueDate: input.dueDate,
          notes: input.notes,
        })
        .returning();
      await writeAuditEvent({
        tenantId: ctx.tenantId,
        entityType: 'allocation',
        entityId: created.id,
        action: 'create',
        actorId: ctx.user.id,
        actorOpenId: ctx.user.openId,
        nextState: JSON.stringify(created),
      });

      // Cache for idempotency replay
      if (input.idempotencyKey) {
        idempotencyStore.set(`${ctx.tenantId}:${input.idempotencyKey}`, created);
      }

      return created;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: statusEnum,
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const { id, ...patch } = input;
      const completedAt = patch.status === 'completed' ? new Date() : undefined;
      const [updated] = await db
        .update(clerkAllocations)
        .set({ ...patch, ...(completedAt ? { completedAt } : {}), updatedAt: new Date() })
        .where(and(eq(clerkAllocations.id, id), eq(clerkAllocations.tenantId, ctx.tenantId)))
        .returning();
      await writeAuditEvent({
        tenantId: ctx.tenantId,
        entityType: 'allocation',
        entityId: id,
        action: `status_change:${patch.status}`,
        actorId: ctx.user.id,
        actorOpenId: ctx.user.openId,
        nextState: JSON.stringify(updated),
      });
      return updated;
    }),

  getPending: adminProcedure.query(({ ctx }) => getPendingAllocations(ctx.tenantId)),

  getByClerk: tenantProcedure
    .input(z.object({ clerkId: z.number() }))
    .query(async ({ ctx, input }) => getAllocationsByClerk(input.clerkId, ctx.tenantId)),
});
