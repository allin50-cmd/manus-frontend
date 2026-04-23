import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { cases } from '../../drizzle/schema';
import { adminProcedure, authedProcedure, router } from '../_core/trpc';
import { getAllCases, getCaseById, getDb, searchCases, writeAuditEvent } from '../db';

const caseStatusEnum = z.enum(['open', 'in_progress', 'closed', 'on_hold']);

const createInput = z.object({
  referenceNumber: z.string().min(1),
  title: z.string().min(1),
  caseType: z.string().min(1),
  plaintiff: z.string().min(1),
  defendant: z.string().min(1),
  status: caseStatusEnum.optional().default('open'),
  judge: z.string().optional(),
  description: z.string().optional(),
});

export const casesRouter = router({
  create: adminProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const [created] = await db.insert(cases).values(input).returning();
    await writeAuditEvent({
      entityType: 'case',
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
        title: z.string().optional(),
        status: caseStatusEnum.optional(),
        judge: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const { id, ...patch } = input;
      const previous = await getCaseById(id);
      const [updated] = await db
        .update(cases)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(cases.id, id))
        .returning();
      await writeAuditEvent({
        entityType: 'case',
        entityId: id,
        action: 'update',
        actorId: ctx.user.id,
        actorOpenId: ctx.user.openId,
        previousState: JSON.stringify(previous),
        nextState: JSON.stringify(updated),
      });
      return updated;
    }),

  list: authedProcedure
    .input(
      z
        .object({
          status: caseStatusEnum.optional(),
          limit: z.number().min(1).max(200).optional().default(50),
          offset: z.number().min(0).optional().default(0),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const all = await getAllCases();
      const filtered = input?.status ? all.filter((c) => c.status === input.status) : all;
      const offset = input?.offset ?? 0;
      const limit = input?.limit ?? 50;
      return filtered.slice(offset, offset + limit);
    }),

  getById: authedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => getCaseById(input.id)),

  search: authedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => searchCases(input.query)),
});
