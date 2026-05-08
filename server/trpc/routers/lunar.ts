import { TRPCError } from '@trpc/server';
import { desc, eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/index';
import { intakeMatters, vaultEvents } from '../../db/schema';
import { buildVaultEvent } from '../../engine/vaultline-audit.js';
import { adminProcedure, tenantProcedure, router } from '../_core/trpc';

const statusEnum = z.enum(['pending', 'in_review', 'matter_created', 'rejected']);

export const lunarRouter = router({
  list: tenantProcedure
    .input(
      z
        .object({
          status: statusEnum.optional(),
          limit: z.number().int().min(1).max(200).default(50),
          offset: z.number().int().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const conditions = input?.status ? [eq(intakeMatters.status, input.status)] : [];

      const rows = conditions.length
        ? await db
            .select()
            .from(intakeMatters)
            .where(and(...conditions))
            .orderBy(desc(intakeMatters.createdAt))
            .limit(input?.limit ?? 50)
            .offset(input?.offset ?? 0)
        : await db
            .select()
            .from(intakeMatters)
            .orderBy(desc(intakeMatters.createdAt))
            .limit(input?.limit ?? 50)
            .offset(input?.offset ?? 0);

      return rows;
    }),

  get: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const [row] = await db
        .select()
        .from(intakeMatters)
        .where(eq(intakeMatters.id, input.id))
        .limit(1);

      if (!row) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Intake matter not found' });
      }

      return row;
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: statusEnum,
      }),
    )
    .mutation(async ({ input }) => {
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const [updated] = await db
        .update(intakeMatters)
        .set({ status: input.status })
        .where(eq(intakeMatters.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Intake matter not found' });
      }

      // Audit the status change in the append-only vault log
      try {
        const auditPayload = { intakeId: input.id, previousStatus: updated.status, newStatus: input.status, changedAt: new Date().toISOString() };
        const vaultEvent = buildVaultEvent(input.id, 'intake.status_changed', auditPayload);
        await db.insert(vaultEvents).values({
          intakeId: input.id,
          eventType: vaultEvent.eventType,
          payload: auditPayload as Record<string, unknown>,
          hash: vaultEvent.hash,
        });
      } catch {
        // Best-effort audit — don't fail the update if vault insert fails
      }

      return updated;
    }),
});
