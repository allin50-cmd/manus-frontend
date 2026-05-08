import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { cases } from '../../drizzle/schema';
import { adminProcedure, tenantProcedure, router } from '../_core/trpc';
import { getAllCases, getAuditEventsByCase, getCaseById, getDb, searchCases, writeAuditEvent } from '../db';
import { ClerkOSEngine } from '../../engine/clerkOS.engine';

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
    const [created] = await db
      .insert(cases)
      .values({
        tenantId: ctx.tenantId,
        referenceNumber: input.referenceNumber,
        title: input.title,
        caseType: input.caseType,
        plaintiff: input.plaintiff,
        defendant: input.defendant,
        status: input.status,
        judge: input.judge,
        description: input.description,
      })
      .returning();
    await writeAuditEvent({
      tenantId: ctx.tenantId,
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
      const previous = await getCaseById(id, ctx.tenantId);
      const [updated] = await db
        .update(cases)
        .set({ ...patch, updatedAt: new Date() })
        .where(and(eq(cases.id, id), eq(cases.tenantId, ctx.tenantId)))
        .returning();
      await writeAuditEvent({
        tenantId: ctx.tenantId,
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

  /** Engine-enforced status transition (validates allowed transitions). */
  transition: adminProcedure
    .input(z.object({ id: z.number(), status: caseStatusEnum }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const engine = new ClerkOSEngine(db, ctx.tenantId);
      const result = await engine.transitionCase(
        input.id,
        input.status,
        ctx.user.id,
        ctx.user.openId,
      );
      if (result.ok === false) throw new Error(result.error);
      return result.value;
    }),

  list: tenantProcedure
    .input(
      z
        .object({
          status: caseStatusEnum.optional(),
          limit: z.number().min(1).max(200).optional().default(50),
          offset: z.number().min(0).optional().default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const all = await getAllCases(ctx.tenantId);
      const filtered = input?.status ? all.filter((c) => c.status === input.status) : all;
      const offset = input?.offset ?? 0;
      const limit = input?.limit ?? 50;
      return filtered.slice(offset, offset + limit);
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => getCaseById(input.id, ctx.tenantId)),

  search: tenantProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => searchCases(input.query, ctx.tenantId)),

  getAuditTrail: tenantProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => getAuditEventsByCase(input.id, ctx.tenantId)),
});
