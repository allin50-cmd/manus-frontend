import { z } from 'zod';
import { clerkDiaries } from '../../drizzle/schema';
import { authedProcedure, router } from '../_core/trpc';
import { getClerkDiaryByDate, getDb } from '../db';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const diaryRouter = router({
  getByClerkAndDate: authedProcedure
    .input(
      z.object({
        clerkId: z.number(),
        date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
      }),
    )
    .query(async ({ input }) => getClerkDiaryByDate(input.clerkId, input.date)),

  create: authedProcedure
    .input(
      z.object({
        clerkId: z.number(),
        date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
        hearingId: z.number().optional(),
        allocationId: z.number().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const [created] = await db.insert(clerkDiaries).values(input).returning();
      return created;
    }),
});
