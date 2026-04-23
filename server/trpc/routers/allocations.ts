import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { clerkAllocations } from '../../drizzle/schema';
import { adminProcedure, authedProcedure, router } from '../_core/trpc';
import { getAllocationsByClerk, getDb, getPendingAllocations, writeAuditEvent } from '../db';

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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const [created] = await db.insert(clerkAllocations).values(input).returning();
      await writeAuditEvent({
        entityType: 'allocation',
        entityId: created.id,
        action: 'create',
        actorId: ctx.user.id,
        actorOpenId: ctx.user.openId,
        nextState: JSON.stringify(created),
      });
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
        .where(eq(clerkAllocations.id, id))
        .returning();
      await writeAuditEvent({
        entityType: 'allocation',
        entityId: id,
        action: `status_change:${patch.status}`,
        actorId: ctx.user.id,
        actorOpenId: ctx.user.openId,
        nextState: JSON.stringify(updated),
      });
      return updated;
    }),

  getPending: adminProcedure.query(() => getPendingAllocations()),

  getByClerk: authedProcedure
    .input(z.object({ clerkId: z.number() }))
    .query(async ({ input }) => getAllocationsByClerk(input.clerkId)),
});
