import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { hearings } from '../../drizzle/schema';
import { adminProcedure, authedProcedure, router } from '../_core/trpc';
import { getAllHearings, getDb, getHearingsByCase, writeAuditEvent } from '../db';

const hearingStatusEnum = z.enum(['scheduled', 'completed', 'postponed', 'cancelled']);

const createInput = z.object({
  caseId: z.number(),
  hearingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  hearingTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm'),
  courtroom: z.string().min(1),
  judge: z.string().min(1),
  status: hearingStatusEnum.optional().default('scheduled'),
  notes: z.string().optional(),
});

export const hearingsRouter = router({
  create: adminProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const [created] = await db.insert(hearings).values(input).returning();
    await writeAuditEvent({
      entityType: 'hearing',
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
        status: hearingStatusEnum.optional(),
        hearingDate: z.string().optional(),
        hearingTime: z.string().optional(),
        courtroom: z.string().optional(),
        judge: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const { id, ...patch } = input;
      const [updated] = await db
        .update(hearings)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(hearings.id, id))
        .returning();
      await writeAuditEvent({
        entityType: 'hearing',
        entityId: id,
        action: 'update',
        actorId: ctx.user.id,
        actorOpenId: ctx.user.openId,
        nextState: JSON.stringify(updated),
      });
      return updated;
    }),

  list: authedProcedure
    .input(
      z
        .object({
          caseId: z.number().optional(),
          status: hearingStatusEnum.optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      if (input?.caseId) return getHearingsByCase(input.caseId);
      const all = await getAllHearings();
      if (input?.status) return all.filter((h) => h.status === input.status);
      return all;
    }),

  getByCaseId: authedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => getHearingsByCase(input.caseId)),
});
