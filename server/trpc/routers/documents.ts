import { z } from 'zod';
import { documents } from '../../drizzle/schema';
import { authedProcedure, router } from '../_core/trpc';
import { getDb, getDocumentsByCase, writeAuditEvent } from '../db';

export const documentsRouter = router({
  create: authedProcedure
    .input(
      z.object({
        caseId: z.number(),
        fileName: z.string().min(1),
        fileUrl: z.string().url(),
        fileType: z.string().min(1),
        fileSize: z.number().optional(),
        documentType: z.string().min(1),
        uploadedBy: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const [created] = await db.insert(documents).values(input).returning();
      await writeAuditEvent({
        entityType: 'document',
        entityId: created.id,
        action: 'upload',
        actorId: ctx.user.id,
        actorOpenId: ctx.user.openId,
        nextState: JSON.stringify({ fileName: created.fileName, caseId: created.caseId }),
      });
      return created;
    }),

  getByCaseId: authedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => getDocumentsByCase(input.caseId)),
});
