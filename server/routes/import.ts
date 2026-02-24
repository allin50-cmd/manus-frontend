/**
 * Import Routes — CSV and PDF ingestion endpoints
 * POST /api/import/csv   — multipart CSV upload
 * POST /api/import/pdf   — multipart PDF upload (Form Recognizer)
 * GET  /api/imports      — list imports for tenant
 * GET  /api/imports/:id/records — list mapped records for an import
 * POST /api/imports/:id/approve — approve an import
 */
import { Router, Request, Response } from 'express';
import { Readable } from 'stream';
import { db } from '../db/index.js';
import { imports, invoiceRecords, mappingTemplates, auditEvents } from '../db/schema-mtd.js';
import { eq, and, desc } from 'drizzle-orm';
import { parseCsvStream, DEFAULT_MAPPING_TEMPLATES, type CsvMappingTemplate } from '../services/csvParser.js';
import { analyzePdfInvoice } from '../services/formRecognizer.js';
import { validateRecords } from '../services/ruleEngine.js';
import { auditWriter } from '../services/auditWriter.js';
import multer from 'multer';

const router = Router();

// In-memory storage for multer (stream to parser without temp files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter(_req, file, cb) {
    const allowed = ['text/csv', 'application/pdf', 'application/vnd.ms-excel', 'text/plain'];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// ─── Middleware: extract tenantId ─────────────────────────────────────────────

function getTenantId(req: Request): string {
  // In production: extract from JWT / Azure AD token claims
  return (req.headers['x-tenant-id'] as string) ?? req.query['tenantId'] as string ?? 'demo-tenant';
}

// ─── POST /api/import/csv ─────────────────────────────────────────────────────

router.post('/csv', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const tenantId = getTenantId(req);
    const templateId = req.body.templateId as string | undefined;

    // Resolve mapping template
    let template: CsvMappingTemplate;
    if (templateId) {
      const [dbTemplate] = await db
        .select()
        .from(mappingTemplates)
        .where(and(eq(mappingTemplates.id, templateId), eq(mappingTemplates.tenantId, tenantId)));

      if (!dbTemplate) {
        return res.status(404).json({ error: `Mapping template ${templateId} not found` });
      }
      template = {
        id: dbTemplate.id,
        tenantId: dbTemplate.tenantId,
        name: dbTemplate.name,
        source: 'csv',
        mappings: dbTemplate.mappings as Record<string, string>,
      };
    } else {
      // Use default generic template
      template = {
        id: 'default',
        tenantId,
        ...DEFAULT_MAPPING_TEMPLATES[2], // Generic UK VAT CSV
      };
    }

    // Create import record
    const [importRecord] = await db
      .insert(imports)
      .values({
        tenantId,
        source: 'csv',
        filename: req.file.originalname,
        status: 'processing',
        mappingTemplateId: templateId ?? undefined,
      })
      .returning();

    // Stream CSV buffer through parser
    const stream = Readable.from(req.file.buffer);
    const parseResult = await parseCsvStream(stream, tenantId, importRecord.id, template);

    // Insert canonical records
    if (parseResult.records.length > 0) {
      const recordErrors = validateRecords(parseResult.records);

      await db.insert(invoiceRecords).values(
        parseResult.records.map((r) => ({
          importId: importRecord.id,
          tenantId,
          invoiceId: r.invoiceId,
          clientId: r.clientId,
          date: r.date,
          netAmount: String(r.netAmount),
          vatAmount: String(r.vatAmount),
          vatCode: r.vatCode,
          currency: r.currency,
          source: r.source,
          confidence: String(r.confidence),
          isValid: recordErrors.filter((e) => e.field.startsWith(`records[`)).length === 0,
          validationErrors: recordErrors.length > 0 ? recordErrors : undefined,
        }))
      );
    }

    // Update import status
    const finalStatus = parseResult.errors.length === 0 ? 'validated' : 'validated';
    await db
      .update(imports)
      .set({
        status: finalStatus,
        recordCount: parseResult.records.length,
        errorCount: parseResult.errors.length,
        confidenceAvg: String(parseResult.confidenceAvg),
        updatedAt: new Date(),
      })
      .where(eq(imports.id, importRecord.id));

    await auditWriter.write(tenantId, 'import.csv_completed', 'import', importRecord.id, {
      filename: req.file.originalname,
      totalRows: parseResult.totalRows,
      validRows: parseResult.validRows,
      errors: parseResult.errors.length,
    });

    return res.status(201).json({
      importId: importRecord.id,
      status: finalStatus,
      totalRows: parseResult.totalRows,
      validRows: parseResult.validRows,
      errors: parseResult.errors,
      confidenceAvg: parseResult.confidenceAvg,
    });
  } catch (err) {
    console.error('[Import/CSV]', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /api/import/pdf ─────────────────────────────────────────────────────

router.post('/pdf', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const tenantId = getTenantId(req);

    // Create import record
    const [importRecord] = await db
      .insert(imports)
      .values({
        tenantId,
        source: 'pdf',
        filename: req.file.originalname,
        status: 'processing',
      })
      .returning();

    // Run Form Recognizer
    const records = await analyzePdfInvoice(req.file.buffer, tenantId, importRecord.id);

    // Insert canonical records
    if (records.length > 0) {
      await db.insert(invoiceRecords).values(
        records.map((r) => ({
          importId: importRecord.id,
          tenantId,
          invoiceId: r.invoiceId,
          clientId: r.clientId,
          date: r.date,
          netAmount: String(r.netAmount),
          vatAmount: String(r.vatAmount),
          vatCode: r.vatCode,
          currency: r.currency,
          source: r.source,
          confidence: String(r.confidence),
          isValid: r.confidence >= 0.6,
        }))
      );
    }

    const confidenceAvg = records.length > 0
      ? records.reduce((s, r) => s + r.confidence, 0) / records.length
      : 0;

    await db
      .update(imports)
      .set({
        status: 'validated',
        recordCount: records.length,
        confidenceAvg: String(confidenceAvg),
        updatedAt: new Date(),
      })
      .where(eq(imports.id, importRecord.id));

    return res.status(201).json({
      importId: importRecord.id,
      status: 'validated',
      recordCount: records.length,
      confidenceAvg,
    });
  } catch (err) {
    console.error('[Import/PDF]', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /api/imports ─────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const limit = Math.min(parseInt(req.query.limit as string ?? '50', 10), 200);
    const offset = parseInt(req.query.offset as string ?? '0', 10);

    const rows = await db
      .select()
      .from(imports)
      .where(eq(imports.tenantId, tenantId))
      .orderBy(desc(imports.createdAt))
      .limit(limit)
      .offset(offset);

    return res.json({ imports: rows, limit, offset });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /api/imports/:id/records ────────────────────────────────────────────

router.get('/:id/records', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    // Verify import belongs to tenant
    const [imp] = await db
      .select()
      .from(imports)
      .where(and(eq(imports.id, id), eq(imports.tenantId, tenantId)));

    if (!imp) return res.status(404).json({ error: 'Import not found' });

    const records = await db
      .select()
      .from(invoiceRecords)
      .where(eq(invoiceRecords.importId, id))
      .orderBy(invoiceRecords.createdAt);

    return res.json({ records, importId: id });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /api/imports/:id/approve ───────────────────────────────────────────

router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const approvedBy = req.body.approvedBy as string ?? 'system';

    const [imp] = await db
      .select()
      .from(imports)
      .where(and(eq(imports.id, id), eq(imports.tenantId, tenantId)));

    if (!imp) return res.status(404).json({ error: 'Import not found' });
    if (!['validated', 'error'].includes(imp.status)) {
      return res.status(400).json({ error: `Cannot approve import in status '${imp.status}'` });
    }

    await db
      .update(imports)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        approvedBy,
        updatedAt: new Date(),
      })
      .where(eq(imports.id, id));

    await auditWriter.write(tenantId, 'import.approved', 'import', id, {
      approvedBy,
      recordCount: imp.recordCount,
    });

    return res.json({ importId: id, status: 'approved', approvedBy });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /api/imports/:id/audit ───────────────────────────────────────────────

router.get('/:id/audit', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const events = await db
      .select()
      .from(auditEvents)
      .where(and(eq(auditEvents.resourceId, id), eq(auditEvents.tenantId, tenantId)))
      .orderBy(desc(auditEvents.createdAt));

    return res.json({ events });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
