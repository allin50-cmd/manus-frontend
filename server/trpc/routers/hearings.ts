import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { hearings } from '../../drizzle/schema.js';
import { adminProcedure, tenantProcedure, router } from '../_core/trpc.js';
import { getAllHearings, getDb, getHearingsByCase, writeAuditEvent } from '../db.js';

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
    const [created] = await db
      .insert(hearings)
      .values({
        tenantId: ctx.tenantId,
        caseId: input.caseId,
        hearingDate: input.hearingDate,
        hearingTime: input.hearingTime,
        courtroom: input.courtroom,
        judge: input.judge,
        status: input.status,
        notes: input.notes,
      })
      .returning();
    await writeAuditEvent({
      tenantId: ctx.tenantId,
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
        .where(and(eq(hearings.id, id), eq(hearings.tenantId, ctx.tenantId)))
        .returning();
      await writeAuditEvent({
        tenantId: ctx.tenantId,
        entityType: 'hearing',
        entityId: id,
        action: 'update',
        actorId: ctx.user.id,
        actorOpenId: ctx.user.openId,
        nextState: JSON.stringify(updated),
      });
      return updated;
    }),

  list: tenantProcedure
    .input(
      z
        .object({
          caseId: z.number().optional(),
          status: hearingStatusEnum.optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (input?.caseId) return getHearingsByCase(input.caseId, ctx.tenantId);
      const all = await getAllHearings(ctx.tenantId);
      if (input?.status) return all.filter((h) => h.status === input.status);
      return all;
    }),

  getByCaseId: tenantProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ ctx, input }) => getHearingsByCase(input.caseId, ctx.tenantId)),
});
