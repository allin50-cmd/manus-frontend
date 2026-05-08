import { z } from 'zod';
import { documents } from '../../drizzle/schema';
import { tenantProcedure, router } from '../_core/trpc';
import { getDb, getDocumentsByCase, writeAuditEvent } from '../db';
import { BlobStorage, buildBlobPath } from '../../services/blobStorage';

export const documentsRouter = router({
  /**
   * Register document metadata after the file has been uploaded to blob storage.
   * Returns a pre-signed SAS upload URL if blob storage is configured.
   */
  create: tenantProcedure
    .input(
      z.object({
        caseId: z.number(),
        fileName: z.string().min(1).max(500),
        fileUrl: z.string().url().max(2048),
        fileType: z.string().min(1).max(100),
        fileSize: z.number().optional(),
        documentType: z.string().min(1).max(100),
        uploadedBy: z.number(),
        contentHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [created] = await db
        .insert(documents)
        .values({
          tenantId: ctx.tenantId,
          caseId: input.caseId,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          fileType: input.fileType,
          fileSize: input.fileSize,
          documentType: input.documentType,
          uploadedBy: input.uploadedBy,
          contentHash: input.contentHash,
          version: 1,
          approvedForBundle: 0,
        })
        .returning();

      // Build canonical blob path for this document
      const blobPath = buildBlobPath(
        ctx.tenantId,
        input.caseId,
        created.id,
        1,
        input.fileName,
      );

      await writeAuditEvent({
        tenantId: ctx.tenantId,
        entityType: 'document',
        entityId: created.id,
        action: 'upload',
        actorId: ctx.user.id,
        actorOpenId: ctx.user.openId,
        nextState: JSON.stringify({ fileName: created.fileName, caseId: created.caseId }),
      });

      return created;
    }),

  getByCaseId: tenantProcedure
    .input(
      z.object({
        caseId: z.number(),
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) =>
      getDocumentsByCase(input.caseId, ctx.tenantId, input.limit, input.offset),
    ),

  /**
   * Generate a short-lived SAS URL for direct client upload to Azure Blob Storage.
   * Returns null if blob storage is not configured.
   */
  getSasUploadUrl: tenantProcedure
    .input(
      z.object({
        caseId: z.number(),
        documentId: z.number(),
        version: z.number().default(1),
        fileName: z.string(),
      }),
    )
    .query(({ ctx, input }) => {
      const blobPath = buildBlobPath(
        ctx.tenantId,
        input.caseId,
        input.documentId,
        input.version,
        input.fileName,
      );
      return {
        blobPath,
        uploadUrl: BlobStorage.generateUploadSasUrl(blobPath),
      };
    }),

  /** Approve a document for inclusion in a bundle (admin only). */
  approveForBundle: tenantProcedure
    .input(z.object({ id: z.number(), approved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const { eq, and } = await import('drizzle-orm');
      const [updated] = await db
        .update(documents)
        .set({ approvedForBundle: input.approved ? 1 : 0, updatedAt: new Date() })
        .where(and(eq(documents.id, input.id), eq(documents.tenantId, ctx.tenantId)))
        .returning();
      await writeAuditEvent({
        tenantId: ctx.tenantId,
        entityType: 'document',
        entityId: input.id,
        action: input.approved ? 'approve_for_bundle' : 'revoke_bundle_approval',
        actorId: ctx.user.id,
        actorOpenId: ctx.user.openId,
      });
      return updated;
    }),
});
