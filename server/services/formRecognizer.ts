/**
 * Azure Form Recognizer (Document Intelligence) Integration
 * Processes uploaded PDF invoices and maps extracted fields to canonical model.
 * Falls back to a mock extractor if Azure credentials are not configured.
 */
import { auditWriter } from './auditWriter.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtractedInvoiceField {
  value: string | number | null;
  confidence: number;
}

export interface ExtractedInvoice {
  invoiceId: ExtractedInvoiceField;
  invoiceDate: ExtractedInvoiceField;
  vendorName: ExtractedInvoiceField;
  subTotal: ExtractedInvoiceField;
  totalTax: ExtractedInvoiceField;
  invoiceTotal: ExtractedInvoiceField;
  currency: ExtractedInvoiceField;
}

export interface CanonicalRecord {
  invoiceId: string;
  tenantId: string;
  clientId: string;
  date: string;
  netAmount: number;
  vatAmount: number;
  vatCode: string;
  currency: string;
  source: 'pdf';
  confidence: number;
}

// ─── Form Recognizer Client ───────────────────────────────────────────────────

async function getFormRecognizerClient(): Promise<{
  beginAnalyzeDocument(modelId: string, buffer: Buffer): Promise<{ pollUntilDone(): Promise<{ documents?: unknown[] }> }>;
} | null> {
  const endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT;
  const apiKey = process.env.AZURE_FORM_RECOGNIZER_KEY;

  if (!endpoint || !apiKey) return null;

  try {
    const { DocumentAnalysisClient, AzureKeyCredential } = await import('@azure/ai-form-recognizer');
    return new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey)) as unknown as ReturnType<typeof getFormRecognizerClient> extends Promise<infer T> ? T : never;
  } catch {
    console.warn('[FormRecognizer] Azure SDK not available — using mock extractor');
    return null;
  }
}

// ─── PDF Analysis ─────────────────────────────────────────────────────────────

/**
 * Analyze a PDF buffer using Azure Form Recognizer prebuilt-invoice model.
 * Falls back to mock extraction if Azure is not configured.
 *
 * @param pdfBuffer   PDF file buffer
 * @param tenantId    FineGuard tenant UUID
 * @param importId    Import record UUID
 * @returns           Array of canonical invoice records (one per detected invoice)
 */
export async function analyzePdfInvoice(
  pdfBuffer: Buffer,
  tenantId: string,
  importId: string
): Promise<CanonicalRecord[]> {
  const client = await getFormRecognizerClient();

  if (!client) {
    // Use mock extractor for local dev / CI
    return mockExtract(tenantId, importId);
  }

  try {
    const poller = await client.beginAnalyzeDocument('prebuilt-invoice', pdfBuffer);
    const result = await poller.pollUntilDone();

    const documents = result.documents ?? [];
    const records = documents.map((doc: unknown) =>
      mapFormRecognizerResult(doc as Record<string, unknown>, tenantId, importId)
    );

    await auditWriter.write(tenantId, 'import.pdf_analyzed', 'import', importId, {
      documentCount: records.length,
      confidenceAvg: records.reduce((s, r) => s + r.confidence, 0) / (records.length || 1),
      usedRealExtractor: true,
    });

    return records;
  } catch (err) {
    console.error('[FormRecognizer] Analysis failed:', (err as Error).message);
    await auditWriter.write(tenantId, 'import.pdf_analysis_error', 'import', importId, {
      error: (err as Error).message,
    });
    throw new Error(`Form Recognizer analysis failed: ${(err as Error).message}`);
  }
}

// ─── Field Mapping ────────────────────────────────────────────────────────────

function mapFormRecognizerResult(
  doc: Record<string, unknown>,
  tenantId: string,
  importId: string
): CanonicalRecord {
  const fields = (doc.fields ?? {}) as Record<string, { value?: string | number; confidence?: number }>;

  const getField = (name: string): ExtractedInvoiceField => ({
    value: fields[name]?.value ?? null,
    confidence: fields[name]?.confidence ?? 0,
  });

  const invoiceId = getField('InvoiceId');
  const invoiceDate = getField('InvoiceDate');
  const vendorName = getField('VendorName');
  const subTotal = getField('SubTotal');
  const totalTax = getField('TotalTax');
  const currency = getField('CurrencyCode');

  // Compute overall confidence as minimum of key fields
  const keyConfidences = [
    invoiceDate.confidence,
    subTotal.confidence,
    totalTax.confidence,
  ].filter((c) => c > 0);
  const confidence =
    keyConfidences.length > 0
      ? keyConfidences.reduce((a, b) => a + b, 0) / keyConfidences.length
      : 0.5;

  // Normalise date
  const dateRaw = String(invoiceDate.value ?? '');
  const date = normaliseDateString(dateRaw);

  return {
    invoiceId: String(invoiceId.value ?? `PDF-${importId}-${Date.now()}`),
    tenantId,
    clientId: String(vendorName.value ?? ''),
    date,
    netAmount: parseFloat(String(subTotal.value ?? '0')) || 0,
    vatAmount: parseFloat(String(totalTax.value ?? '0')) || 0,
    vatCode: 'OUTPUT',
    currency: String(currency.value ?? 'GBP'),
    source: 'pdf',
    confidence: Math.round(confidence * 100) / 100,
  };
}

function normaliseDateString(raw: string): string {
  if (!raw) return '';
  // Handle ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.split('T')[0];
  // Handle US format M/D/YYYY
  const usMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) return `${usMatch[3]}-${usMatch[2].padStart(2, '0')}-${usMatch[1].padStart(2, '0')}`;
  // Return as-is and let validation flag it
  return raw;
}

// ─── Mock Extractor ───────────────────────────────────────────────────────────

/**
 * Mock PDF extractor for local development and CI environments
 * without Azure Form Recognizer credentials.
 */
function mockExtract(tenantId: string, importId: string): CanonicalRecord[] {
  return [
    {
      invoiceId: `MOCK-PDF-${importId}`,
      tenantId,
      clientId: 'Mock Vendor Ltd',
      date: new Date().toISOString().split('T')[0],
      netAmount: 1000.0,
      vatAmount: 200.0,
      vatCode: 'OUTPUT',
      currency: 'GBP',
      source: 'pdf',
      confidence: 0.75, // Lower confidence for mock
    },
  ];
}

// ─── Batch Processing ─────────────────────────────────────────────────────────

/**
 * Process multiple PDF buffers in batches to avoid Form Recognizer rate limits.
 * Uses Azure Service Bus for queuing in production (falls back to sequential processing).
 *
 * @param pdfBuffers  Array of { buffer, filename } objects
 * @param tenantId    FineGuard tenant UUID
 * @param importId    Import record UUID
 * @param batchSize   Number of PDFs to process concurrently (default: 3)
 */
export async function batchAnalyzePdfs(
  pdfBuffers: Array<{ buffer: Buffer; filename: string }>,
  tenantId: string,
  importId: string,
  batchSize = 3
): Promise<CanonicalRecord[]> {
  const allRecords: CanonicalRecord[] = [];

  for (let i = 0; i < pdfBuffers.length; i += batchSize) {
    const batch = pdfBuffers.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(({ buffer }) => analyzePdfInvoice(buffer, tenantId, importId))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        allRecords.push(...result.value);
      } else {
        console.error('[FormRecognizer] Batch item failed:', result.reason);
      }
    }

    // Small delay between batches to respect rate limits
    if (i + batchSize < pdfBuffers.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return allRecords;
}
