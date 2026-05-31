import { z } from 'zod';
import type { TenantContext } from '@/lib/auth';
import { emit } from '@/lib/events';
import { safeString } from '@/lib/validators';
import { fetchDocument, type DocumentType } from './documents';
import { extractFromDocument } from './extraction';
import { generateBilling } from './billing';

const processDocumentSchema = z.object({
  documentUrl: z.string().url(),
  documentType: z.enum(['brief', 'email', 'transcript', 'pleading']),
  ratePerHour: z.number().positive().optional(),
});

const generateBillingSchema = z.object({
  text: safeString({ min: 1, max: 50000 }),
  ratePerHour: z.number().positive(),
});

export async function handleLawAction(
  ctx: TenantContext,
  action: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  switch (action) {
    case 'process-document':
      return processDocument(ctx, processDocumentSchema.parse(payload));
    case 'generate-billing':
      return generateBillingAction(ctx, generateBillingSchema.parse(payload));
    default:
      throw new Error(`Unknown law action: ${action}`);
  }
}

export async function processDocument(
  ctx: TenantContext,
  input: z.infer<typeof processDocumentSchema>,
) {
  const rate = input.ratePerHour ?? 250;
  const doc = await fetchDocument(input.documentUrl);
  const extraction = await extractFromDocument(doc.text, input.documentType as DocumentType, rate);

  await emit(
    'law.document.processed',
    {
      documentUrl: input.documentUrl,
      documentType: input.documentType,
      bytes: doc.bytes,
      mime: doc.mime,
      taskCount: extraction.tasks.length,
      billingTotal: extraction.billingEntries.reduce((s, e) => s + e.value, 0),
      complianceFlagCount: extraction.complianceFlags.length,
    },
    ctx.tenant.id,
  );

  return {
    document: { source: doc.source, mime: doc.mime, bytes: doc.bytes },
    tasks: extraction.tasks,
    parties: extraction.parties,
    deadlines: extraction.deadlines,
    billingEntries: extraction.billingEntries,
    complianceFlags: extraction.complianceFlags,
    summary: extraction.summary,
  };
}

export async function generateBillingAction(
  ctx: TenantContext,
  input: z.infer<typeof generateBillingSchema>,
) {
  const result = await generateBilling(input);
  await emit(
    'law.billing.generated',
    {
      entryCount: result.entries.length,
      totalHours: result.totalHours,
      totalValue: result.totalValue,
      source: result.source,
    },
    ctx.tenant.id,
  );
  return result;
}

export { processDocumentSchema, generateBillingSchema };
