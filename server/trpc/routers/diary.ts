import { z } from 'zod';
import { clerkDiaries } from '../../drizzle/schema';
import { tenantProcedure, router } from '../_core/trpc';
import { getClerkDiaryByDate, getDb } from '../db';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const diaryRouter = router({
  getByClerkAndDate: tenantProcedure
    .input(
      z.object({
        clerkId: z.number(),
        date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
      }),
    )
    .query(async ({ ctx, input }) =>
      getClerkDiaryByDate(input.clerkId, input.date, ctx.tenantId),
    ),

  create: tenantProcedure
    .input(
      z.object({
        clerkId: z.number(),
        date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
        hearingId: z.number().optional(),
        allocationId: z.number().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const [created] = await db
        .insert(clerkDiaries)
        .values({ ...input, tenantId: ctx.tenantId })
        .returning();
      return created;
    }),
});
