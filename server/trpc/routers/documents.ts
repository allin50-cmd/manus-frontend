import { z } from 'zod';
import { documents } from '../../drizzle/schema';
import { tenantProcedure, router } from '../_core/trpc';
import { getDb, getDocumentsByCase, writeAuditEvent } from '../db';
import { BlobStorage, buildBlobPath } from '../../services/blobStorage';
import { mockDocuments, nextMockId } from '../mock-db';

export const documentsRouter = router({
  /**
   * Register document metadata after the file has been uploaded to blob storage.
   * Returns a pre-signed SAS upload URL if blob storage is configured.
   */
  create: tenantProcedure
    .input(
      z.object({
        caseId: z.number(),
        fileName: z.string().min(1),
        fileUrl: z.string(),
        fileType: z.string().min(1),
        fileSize: z.number().optional(),
        documentType: z.string().min(1),
        uploadedBy: z.number(),
        contentHash: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        const created = {
          id: nextMockId(mockDocuments),
          tenantId: ctx.tenantId,
          caseId: input.caseId,
          fileName: input.fileName,
          blobPath: null,
          fileUrl: input.fileUrl,
          fileType: input.fileType,
          fileSize: input.fileSize ?? null,
          documentType: input.documentType,
          version: 1,
          contentHash: input.contentHash ?? null,
          approvedForBundle: 0,
          uploadedBy: input.uploadedBy,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockDocuments.push(created);
        return created;
      }

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

      buildBlobPath(ctx.tenantId, input.caseId, created.id, 1, input.fileName);

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
    .input(z.object({ caseId: z.number() }))
    .query(async ({ ctx, input }) => getDocumentsByCase(input.caseId, ctx.tenantId)),

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
      if (!db) {
        const idx = mockDocuments.findIndex(
          (d) => d.id === input.id && d.tenantId === ctx.tenantId,
        );
        if (idx === -1) throw new Error(`Document ${input.id} not found`);
        mockDocuments[idx] = {
          ...mockDocuments[idx],
          approvedForBundle: input.approved ? 1 : 0,
          updatedAt: new Date(),
        };
        return mockDocuments[idx];
      }
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
