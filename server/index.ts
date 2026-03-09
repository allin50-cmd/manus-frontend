/**
 * FineGuard Pro - Main Server
 *
 * Express.js API server for the FineGuard Pro SaaS platform.
 * Provides endpoints for: authentication, company management,
 * VAT validation, Companies House scanning, compliance dashboard,
 * alerts, document vault, and Stripe billing.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { db } from './db/index';
import {
  deploymentStatus, leads, intakeForms, complianceBundles, contacts,
  users, firms, companies, deadlines, vatCheckReports, timelineEvents,
  alerts, documents, toolTransactions, auditLog
} from './db/schema';
import { desc, eq, and, isNull } from 'drizzle-orm';
import { companiesHouseService } from './services/companiesHouse';
import { validateVATReturn, parseVATBoxes } from './services/vatValidator';
import { requireAuth, generateToken, type AuthUser } from './middleware/auth';
import { createAlert, evaluateCompanyAlerts } from './services/alertsEngine';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DEPLOY_RECORD_TOKEN = process.env.DEPLOY_RECORD_TOKEN;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// File upload middleware (memory storage for now; swap to S3 in production)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv', 'application/csv',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Excel, and CSV files are accepted'));
    }
  },
});

// ============================================================================
// AUDIT LOGGING HELPER
// ============================================================================

async function logAction(userId: string | undefined, action: string, entityType?: string, entityId?: string, details?: Record<string, unknown>) {
  try {
    await db.insert(auditLog).values({
      userId: userId || null,
      action,
      entityType: entityType || null,
      entityId: entityId ? entityId as unknown as string : null,
      details: details ? JSON.stringify(details) : null,
    });
  } catch {
    // Non-fatal
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await db.select().from(deploymentStatus).limit(1);
    res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'connected' });
  } catch {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

app.get('/health', async (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * POST /api/auth/register
 * Create a new user and firm account
 */
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, firmName } = req.body;

    if (!name || !email || !password || !firmName) {
      return res.status(400).json({ ok: false, error: 'All fields are required: name, email, password, firmName' });
    }

    if (password.length < 8) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters' });
    }

    // Check email not already registered
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ ok: false, error: 'An account with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create firm
    const [firm] = await db.insert(firms).values({
      firmName,
      subscriptionPlan: 'free',
    }).returning();

    // Create user
    const [user] = await db.insert(users).values({
      name,
      email: email.toLowerCase(),
      passwordHash,
      firmId: firm.id,
    }).returning();

    const tokenUser: AuthUser = { id: user.id, email: user.email, firmId: firm.id, name: user.name };
    const token = generateToken(tokenUser);

    await logAction(user.id, 'register', 'user', user.id);

    res.status(201).json({
      ok: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, firmId: firm.id, firmName: firm.firmName },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ ok: false, error: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password are required' });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    // Get firm
    const [firm] = await db.select().from(firms).where(eq(firms.id, user.firmId!)).limit(1);

    const tokenUser: AuthUser = { id: user.id, email: user.email, firmId: user.firmId!, name: user.name };
    const token = generateToken(tokenUser);

    await logAction(user.id, 'login', 'user', user.id);

    res.json({
      ok: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, firmId: user.firmId, firmName: firm?.firmName || '' },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ ok: false, error: 'Login failed. Please try again.' });
  }
});

// ============================================================================
// COMPANY MANAGEMENT
// ============================================================================

/**
 * GET /api/companies
 * Get all companies for the authenticated firm
 */
app.get('/api/companies', requireAuth, async (req: Request, res: Response) => {
  try {
    const firmId = req.user!.firmId;

    const firmCompanies = await db
      .select()
      .from(companies)
      .where(eq(companies.firmId, firmId))
      .orderBy(desc(companies.createdAt));

    // Get deadlines for each company
    const enriched = await Promise.all(firmCompanies.map(async (company) => {
      const companyDeadlines = await db
        .select()
        .from(deadlines)
        .where(eq(deadlines.companyId, company.id));

      const deadlineMap: Record<string, string | undefined> = {};
      for (const d of companyDeadlines) {
        if (d.deadlineType === 'accounts') deadlineMap.accountsDueDate = d.dueDate || undefined;
        if (d.deadlineType === 'confirmation_statement') deadlineMap.confirmationDue = d.dueDate || undefined;
        if (d.deadlineType === 'vat_return') deadlineMap.vatDue = d.dueDate || undefined;
      }

      return { ...company, deadlines: deadlineMap };
    }));

    // Stats
    const total = firmCompanies.length;
    const compliant = firmCompanies.filter((c) => c.complianceStatus === 'compliant').length;
    const warning = firmCompanies.filter((c) => c.complianceStatus === 'warning').length;
    const overdue = firmCompanies.filter((c) => c.complianceStatus === 'overdue').length;

    const unresolvedAlerts = await db
      .select()
      .from(alerts)
      .where(and(eq(alerts.firmId, firmId), eq(alerts.resolved, false)));

    res.json({
      companies: enriched,
      stats: { totalCompanies: total, compliant, warning, overdue, unresolvedAlerts: unresolvedAlerts.length },
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

/**
 * POST /api/companies
 * Add a new company to the firm's portfolio
 */
app.post('/api/companies', requireAuth, async (req: Request, res: Response) => {
  try {
    const { companyName, companyNumber, vatNumber, accountingYearEnd } = req.body;
    const firmId = req.user!.firmId;

    if (!companyName) {
      return res.status(400).json({ ok: false, error: 'Company name is required' });
    }

    let companyData: Partial<typeof companies.$inferInsert> = {
      firmId,
      companyName,
      companyNumber: companyNumber || null,
      vatNumber: vatNumber || null,
      accountingYearEnd: accountingYearEnd || null,
      complianceStatus: 'unknown',
    };

    // If company number provided, fetch from Companies House
    if (companyNumber) {
      try {
        const formatted = companiesHouseService.formatCompanyNumber(companyNumber);
        const profile = await companiesHouseService.getCompanyProfile(formatted);
        if (profile) {
          companyData.companyName = profile.companyName;
          companyData.companyStatus = profile.companyStatus;
          companyData.incorporationDate = profile.dateOfCreation;
          companyData.lastChecked = new Date();
        }
      } catch {
        // Non-fatal — company added without CH data
      }
    }

    const [company] = await db.insert(companies).values(companyData as typeof companies.$inferInsert).returning();

    // Log timeline event
    await db.insert(timelineEvents).values({
      companyId: company.id,
      eventType: 'company_check',
      source: 'manual',
      notes: `Company added to FineGuard dashboard by ${req.user!.name}`,
    });

    await logAction(req.user!.id, 'add_company', 'company', company.id, { companyName });

    res.status(201).json({ ok: true, company });
  } catch (error) {
    console.error('Error adding company:', error);
    res.status(500).json({ ok: false, error: 'Failed to add company' });
  }
});

/**
 * GET /api/companies/:id
 * Get a single company with timeline, deadlines, and alerts
 */
app.get('/api/companies/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const firmId = req.user!.firmId;

    const [company] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, id), eq(companies.firmId, firmId)))
      .limit(1);

    if (!company) return res.status(404).json({ error: 'Company not found' });

    const [timeline, companyDeadlines, companyAlerts] = await Promise.all([
      db.select().from(timelineEvents).where(eq(timelineEvents.companyId, id)).orderBy(desc(timelineEvents.eventDate)),
      db.select().from(deadlines).where(eq(deadlines.companyId, id)),
      db.select().from(alerts).where(eq(alerts.companyId, id)).orderBy(desc(alerts.createdAt)),
    ]);

    res.json({ company: { ...company, timeline, deadlines: companyDeadlines, alerts: companyAlerts } });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

/**
 * POST /api/companies/:id/refresh
 * Refresh company data from Companies House
 */
app.post('/api/companies/:id/refresh', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const firmId = req.user!.firmId;

    const [company] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, id), eq(companies.firmId, firmId)))
      .limit(1);

    if (!company) return res.status(404).json({ error: 'Company not found' });
    if (!company.companyNumber) return res.status(400).json({ error: 'No Companies House number set' });

    const profile = await companiesHouseService.getCompanyProfile(company.companyNumber);
    if (!profile) return res.status(404).json({ error: 'Company not found in Companies House' });

    const compliance = await companiesHouseService.getComplianceStatus(company.companyNumber);

    // Update company record
    await db.update(companies)
      .set({
        companyName: profile.companyName,
        companyStatus: profile.companyStatus,
        incorporationDate: profile.dateOfCreation,
        complianceStatus: compliance.status,
        lastChecked: new Date(),
      })
      .where(eq(companies.id, id));

    // Upsert deadline records
    const deadlineUpdates = [
      { type: 'accounts', date: compliance.accountsStatus.nextDue, status: compliance.accountsStatus.overdue ? 'overdue' : 'pending' },
      { type: 'confirmation_statement', date: compliance.confirmationStatementStatus.nextDue, status: compliance.confirmationStatementStatus.overdue ? 'overdue' : 'pending' },
    ];

    for (const dl of deadlineUpdates) {
      const existing = await db.select().from(deadlines)
        .where(and(eq(deadlines.companyId, id), eq(deadlines.deadlineType, dl.type)))
        .limit(1);

      if (existing.length > 0) {
        await db.update(deadlines)
          .set({ dueDate: dl.date !== 'N/A' ? dl.date : null, status: dl.status, lastChecked: new Date() })
          .where(eq(deadlines.id, existing[0].id));
      } else {
        await db.insert(deadlines).values({
          companyId: id,
          deadlineType: dl.type,
          dueDate: dl.date !== 'N/A' ? dl.date : null,
          status: dl.status,
        });
      }
    }

    // Record timeline event
    await db.insert(timelineEvents).values({
      companyId: id,
      eventType: 'company_check',
      source: 'companies_house',
      notes: `Compliance data refreshed from Companies House. Status: ${compliance.status}`,
    });

    // Evaluate and create alerts
    const newAlerts = await evaluateCompanyAlerts(id, firmId, {
      accountsDaysUntilDue: compliance.accountsStatus.daysUntilDue,
      accountsOverdue: compliance.accountsStatus.overdue,
      confirmationDaysUntilDue: compliance.confirmationStatementStatus.daysUntilDue,
      confirmationOverdue: compliance.confirmationStatementStatus.overdue,
    });
    for (const alert of newAlerts) {
      await createAlert(alert);
    }

    await logAction(req.user!.id, 'refresh_company', 'company', id);

    res.json({ ok: true, message: 'Company data refreshed from Companies House' });
  } catch (error) {
    console.error('Error refreshing company:', error);
    res.status(500).json({ error: 'Failed to refresh company data' });
  }
});

// ============================================================================
// VAT VALIDATION
// ============================================================================

/**
 * POST /api/vat-check
 * Validate a VAT return and store the result
 *
 * Inputs: box1-box9 VAT return values, optional companyId/companyRef
 * Outputs: PASS/WARNING/ERROR with detailed breakdown
 * Price: £1 per check (Stripe integration point)
 */
app.post('/api/vat-check', requireAuth, async (req: Request, res: Response) => {
  try {
    const boxes = parseVATBoxes(req.body);
    if (!boxes) {
      return res.status(400).json({ ok: false, error: 'Missing required VAT box values (box1, box2, box4, box6, box7)' });
    }

    const validationResult = validateVATReturn(boxes);

    // Store result in database
    const [report] = await db.insert(vatCheckReports).values({
      companyId: req.body.companyId || null,
      userId: req.user!.id,
      firmId: req.user!.firmId,
      box1: String(boxes.box1),
      box2: String(boxes.box2),
      box3: String(boxes.box3),
      box4: String(boxes.box4),
      box5: String(boxes.box5),
      box6: String(boxes.box6),
      box7: String(boxes.box7),
      box8: String(boxes.box8),
      box9: String(boxes.box9),
      result: validationResult.result,
      warnings: JSON.stringify(validationResult.warnings),
      errors: JSON.stringify(validationResult.errors),
    }).returning();

    // Record in tool transactions (£1)
    await db.insert(toolTransactions).values({
      userId: req.user!.id,
      firmId: req.user!.firmId,
      toolName: 'vat_checker',
      price: '1.00',
      status: 'completed',
    });

    // If linked to a company, record timeline event
    if (req.body.companyId) {
      await db.insert(timelineEvents).values({
        companyId: req.body.companyId,
        eventType: 'vat_validation',
        source: 'fineguard',
        notes: `VAT return validation: ${validationResult.result}. ${validationResult.errors.length} errors, ${validationResult.warnings.length} warnings.`,
      });
    }

    await logAction(req.user!.id, 'vat_check', 'vat_report', report.id, { result: validationResult.result });

    res.json({
      ok: true,
      result: {
        ...validationResult,
        reportId: report.id,
      },
    });
  } catch (error) {
    console.error('VAT validation error:', error);
    res.status(500).json({ ok: false, error: 'VAT validation failed. Please try again.' });
  }
});

/**
 * GET /api/vat-reports
 * Get VAT check history for the firm
 */
app.get('/api/vat-reports', requireAuth, async (req: Request, res: Response) => {
  try {
    const reports = await db
      .select()
      .from(vatCheckReports)
      .where(eq(vatCheckReports.firmId, req.user!.firmId))
      .orderBy(desc(vatCheckReports.createdAt))
      .limit(50);

    res.json({ reports });
  } catch {
    res.status(500).json({ error: 'Failed to fetch VAT reports' });
  }
});

// ============================================================================
// COMPANIES HOUSE DEADLINE SCANNER
// ============================================================================

/**
 * POST /api/deadline-scan
 * Bulk scan company deadlines from Companies House
 *
 * Input: array of company registration numbers
 * Output: compliance data for each company
 * Price: £1 per scan
 */
app.post('/api/deadline-scan', requireAuth, async (req: Request, res: Response) => {
  try {
    const { companyNumbers } = req.body;

    if (!companyNumbers || !Array.isArray(companyNumbers) || companyNumbers.length === 0) {
      return res.status(400).json({ ok: false, error: 'Please provide an array of company numbers' });
    }

    if (companyNumbers.length > 50) {
      return res.status(400).json({ ok: false, error: 'Maximum 50 companies per scan' });
    }

    const results = await Promise.all(
      companyNumbers.map(async (rawNumber: string) => {
        try {
          const formatted = companiesHouseService.formatCompanyNumber(rawNumber);

          if (!companiesHouseService.validateCompanyNumber(rawNumber)) {
            return {
              companyNumber: rawNumber,
              companyName: 'Invalid number',
              companyStatus: 'error',
              complianceStatus: 'error' as const,
              riskLevel: 'high' as const,
              overdueFilings: [],
              estimatedPenalties: 0,
              error: 'Invalid company number format',
            };
          }

          const [profile, compliance] = await Promise.all([
            companiesHouseService.getCompanyProfile(formatted),
            companiesHouseService.getComplianceStatus(formatted),
          ]);

          if (!profile) {
            return {
              companyNumber: formatted,
              companyName: 'Not found',
              companyStatus: 'error',
              complianceStatus: 'error' as const,
              riskLevel: 'high' as const,
              overdueFilings: [],
              estimatedPenalties: 0,
              error: 'Company not found in Companies House',
            };
          }

          const penalties = compliance.penalties.reduce((sum: number, p: { estimated: number }) => sum + p.estimated, 0);

          return {
            companyNumber: formatted,
            companyName: profile.companyName,
            companyStatus: profile.companyStatus,
            incorporationDate: profile.dateOfCreation,
            complianceStatus: compliance.status,
            riskLevel: compliance.riskLevel,
            accountsDueDate: compliance.accountsStatus.nextDue,
            accountsDaysUntilDue: compliance.accountsStatus.daysUntilDue,
            accountsOverdue: compliance.accountsStatus.overdue,
            confirmationStatementDue: compliance.confirmationStatementStatus.nextDue,
            confirmationDaysUntilDue: compliance.confirmationStatementStatus.daysUntilDue,
            confirmationOverdue: compliance.confirmationStatementStatus.overdue,
            overdueFilings: compliance.overdueFilings.map((f: { type: string; description: string; daysUntilDue: number; penaltyRisk: number }) => ({
              type: f.type,
              description: f.description,
              daysOverdue: Math.abs(f.daysUntilDue),
              penaltyRisk: f.penaltyRisk,
            })),
            estimatedPenalties: penalties,
          };
        } catch {
          return {
            companyNumber: rawNumber,
            companyName: 'Error',
            companyStatus: 'error',
            complianceStatus: 'error' as const,
            riskLevel: 'high' as const,
            overdueFilings: [],
            estimatedPenalties: 0,
            error: 'Failed to fetch data from Companies House',
          };
        }
      })
    );

    // Summary
    const summary = {
      compliant: results.filter((r) => r.complianceStatus === 'compliant').length,
      warning: results.filter((r) => r.complianceStatus === 'warning').length,
      overdue: results.filter((r) => r.complianceStatus === 'overdue').length,
      errors: results.filter((r) => r.complianceStatus === 'error').length,
      totalPenaltyExposure: results.reduce((sum, r) => sum + (r.estimatedPenalties || 0), 0),
    };

    // Record tool transaction (£1 per scan)
    await db.insert(toolTransactions).values({
      userId: req.user!.id,
      firmId: req.user!.firmId,
      toolName: 'deadline_scanner',
      price: '1.00',
      status: 'completed',
    });

    const scanId = `SCAN-${Date.now()}`;

    await logAction(req.user!.id, 'deadline_scan', undefined, undefined, {
      count: companyNumbers.length,
      scanId,
    });

    res.json({
      ok: true,
      result: {
        scanId,
        totalCompanies: results.length,
        results,
        summary,
      },
    });
  } catch (error) {
    console.error('Deadline scan error:', error);
    res.status(500).json({ ok: false, error: 'Scan failed. Please try again.' });
  }
});

// ============================================================================
// ALERTS
// ============================================================================

/**
 * GET /api/alerts
 * Get all alerts for the authenticated firm
 */
app.get('/api/alerts', requireAuth, async (req: Request, res: Response) => {
  try {
    const firmAlerts = await db
      .select()
      .from(alerts)
      .where(eq(alerts.firmId, req.user!.firmId))
      .orderBy(desc(alerts.createdAt))
      .limit(100);

    res.json({ alerts: firmAlerts });
  } catch {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * PATCH /api/alerts/:id/resolve
 * Mark an alert as resolved
 */
app.patch('/api/alerts/:id/resolve', requireAuth, async (req: Request, res: Response) => {
  try {
    const [alert] = await db
      .update(alerts)
      .set({ resolved: true, resolvedAt: new Date() })
      .where(and(eq(alerts.id, req.params.id), eq(alerts.firmId, req.user!.firmId)))
      .returning();

    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    res.json({ ok: true, alert });
  } catch {
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// ============================================================================
// DOCUMENT VAULT
// ============================================================================

/**
 * GET /api/documents
 * Get all documents for the firm, optionally filtered by company
 */
app.get('/api/documents', requireAuth, async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;
    const firmId = req.user!.firmId;

    let query = db.select().from(documents).where(eq(documents.firmId, firmId));

    if (companyId && typeof companyId === 'string') {
      // @ts-ignore
      query = query.where(and(eq(documents.firmId, firmId), eq(documents.companyId, companyId)));
    }

    // @ts-ignore
    const docs = await query.orderBy(desc(documents.createdAt)).limit(200);

    // Enrich with company names
    const enriched = await Promise.all(docs.map(async (doc) => {
      if (doc.companyId) {
        const [company] = await db.select({ name: companies.companyName })
          .from(companies)
          .where(eq(companies.id, doc.companyId))
          .limit(1);
        return { ...doc, companyName: company?.name };
      }
      return doc;
    }));

    res.json({ documents: enriched });
  } catch {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

/**
 * POST /api/documents/upload
 * Upload a compliance document
 */
app.post('/api/documents/upload', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded' });
    }

    const { companyId, documentType } = req.body;
    const firmId = req.user!.firmId;

    // In production: upload to AWS S3 or Supabase Storage
    // For now: store metadata only with a placeholder URL
    const fileName = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fileUrl = process.env.STORAGE_BASE_URL
      ? `${process.env.STORAGE_BASE_URL}/${firmId}/${fileName}`
      : null;

    // Calculate retention date (7 years from now)
    const retentionUntil = new Date();
    retentionUntil.setFullYear(retentionUntil.getFullYear() + 7);

    const [doc] = await db.insert(documents).values({
      firmId,
      companyId: companyId || null,
      fileName,
      originalName: req.file.originalname,
      fileUrl,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      documentType: documentType || 'other',
      uploadedBy: req.user!.id,
      retentionUntil,
    }).returning();

    // Log timeline event for company
    if (companyId) {
      await db.insert(timelineEvents).values({
        companyId,
        eventType: 'document_upload',
        source: 'manual',
        notes: `Document uploaded: ${req.file.originalname} (${documentType || 'other'})`,
      });
    }

    await logAction(req.user!.id, 'upload_document', 'document', doc.id, {
      fileName: req.file.originalname,
      documentType,
    });

    res.status(201).json({ ok: true, document: doc });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ ok: false, error: 'Upload failed. Please try again.' });
  }
});

/**
 * DELETE /api/documents/:id
 * Delete a document (firm owner only)
 */
app.delete('/api/documents/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const [doc] = await db
      .delete(documents)
      .where(and(eq(documents.id, req.params.id), eq(documents.firmId, req.user!.firmId)))
      .returning();

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    await logAction(req.user!.id, 'delete_document', 'document', req.params.id);

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// ============================================================================
// COMPLIANCE API (External access points)
// ============================================================================

/**
 * GET /api/company-compliance-score/:companyNumber
 * Public API: Get compliance score for a company number
 */
app.get('/api/company-compliance-score/:companyNumber', requireAuth, async (req: Request, res: Response) => {
  try {
    const { companyNumber } = req.params;
    const formatted = companiesHouseService.formatCompanyNumber(companyNumber);
    const compliance = await companiesHouseService.getComplianceStatus(formatted);

    const score = compliance.status === 'compliant' ? 100
      : compliance.status === 'warning' ? 65
      : 30;

    res.json({
      companyNumber: formatted,
      complianceScore: score,
      status: compliance.status,
      riskLevel: compliance.riskLevel,
      accountsDue: compliance.accountsStatus.nextDue,
      confirmationDue: compliance.confirmationStatementStatus.nextDue,
      overdueFilings: compliance.overdueFilings.length,
    });
  } catch {
    res.status(500).json({ error: 'Failed to get compliance score' });
  }
});

// ============================================================================
// LEGACY ENDPOINTS (preserved from original server)
// ============================================================================

app.post('/api/deployments/record', async (req: Request, res: Response) => {
  try {
    const token = req.headers['x-deploy-token'];
    if (!token || token !== DEPLOY_RECORD_TOKEN) return res.status(401).json({ error: 'Unauthorized' });

    const { environment, status, commit, workflowRun } = req.body;
    if (!['dev', 'staging', 'prod'].includes(environment) || !['success', 'failed', 'in_progress'].includes(status)) {
      return res.status(400).json({ error: 'Invalid environment or status' });
    }

    const [deployment] = await db.insert(deploymentStatus)
      .values({ environment, status, commit: commit.substring(0, 50), workflowRun: workflowRun.toString() })
      .returning();

    res.status(201).json({ success: true, id: deployment.id });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/deployments/status', async (_req: Request, res: Response) => {
  try {
    const all = await db.select().from(deploymentStatus).orderBy(desc(deploymentStatus.deployedAt));
    const latest = new Map();
    for (const d of all) {
      if (!latest.has(d.environment)) latest.set(d.environment, d);
    }
    res.json({ deployments: Array.from(latest.values()) });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/lead', async (req: Request, res: Response) => {
  try {
    const { name, email, company, product, phone, message } = req.body;
    if (!name || !email) return res.status(400).json({ ok: false, error: 'Name and email are required' });

    const [lead] = await db.insert(leads).values({
      leadId: `LEAD-${Date.now()}`, name, email,
      company: company || null, product: product || null, phone: phone || null, message: message || null,
    }).returning();

    res.status(201).json({ ok: true, message: "Thank you for your interest!", leadId: lead.leadId });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to save lead' });
  }
});

app.post('/api/compliance-bundle', async (req: Request, res: Response) => {
  try {
    const { companyName, companyNumber, requestorName, requestorEmail, bundleType } = req.body;
    if (!companyNumber) return res.status(400).json({ ok: false, error: 'Company number is required' });

    if (!companiesHouseService.validateCompanyNumber(companyNumber)) {
      return res.status(400).json({ ok: false, error: 'Invalid company number format' });
    }

    const formatted = companiesHouseService.formatCompanyNumber(companyNumber);
    const [profile, compliance] = await Promise.all([
      companiesHouseService.getCompanyProfile(formatted),
      companiesHouseService.getComplianceStatus(formatted),
    ]);

    if (!profile) return res.status(404).json({ ok: false, error: 'Company not found in Companies House' });

    const bundleId = `BUNDLE-${Date.now()}`;
    await db.insert(complianceBundles).values({
      bundleId,
      companyName: profile.companyName,
      companyNumber: formatted,
      requestorName: requestorName || null,
      requestorEmail: requestorEmail || null,
      bundleType: bundleType || 'full',
      estimatedTime: 'Generated instantly',
    });

    res.status(201).json({
      ok: true, message: 'Real-time compliance check complete', bundleId,
      company: { number: profile.companyNumber, name: profile.companyName, status: profile.companyStatus, incorporationDate: profile.dateOfCreation },
      compliance: {
        status: compliance.status, riskLevel: compliance.riskLevel,
        accounts: { nextDue: compliance.accountsStatus.nextDue, daysUntilDue: compliance.accountsStatus.daysUntilDue, overdue: compliance.accountsStatus.overdue },
        confirmationStatement: { nextDue: compliance.confirmationStatementStatus.nextDue, daysUntilDue: compliance.confirmationStatementStatus.daysUntilDue, overdue: compliance.confirmationStatementStatus.overdue },
        overdueFilings: compliance.overdueFilings.map((f: { type: string; description: string; daysUntilDue: number; penaltyRisk: number }) => ({
          type: f.type, description: f.description, daysOverdue: Math.abs(f.daysUntilDue), penaltyRisk: f.penaltyRisk,
        })),
        penalties: compliance.penalties,
      },
    });
  } catch (error) {
    console.error('Compliance bundle error:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch company information' });
  }
});

// ============================================================================
// STATIC FILE SERVING
// ============================================================================

const distPath = path.join(__dirname, '../dist/public');
app.use(express.static(distPath));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  if (err.message.includes('Only PDF')) {
    return res.status(400).json({ ok: false, error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('🛡️  FineGuard Pro Server');
  console.log('========================');
  console.log(`📡 Running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log('');
  console.log('API Endpoints:');
  console.log('  POST /api/auth/register, /api/auth/login');
  console.log('  GET/POST /api/companies, GET /api/companies/:id');
  console.log('  POST /api/companies/:id/refresh');
  console.log('  POST /api/vat-check, GET /api/vat-reports');
  console.log('  POST /api/deadline-scan');
  console.log('  GET /api/alerts, PATCH /api/alerts/:id/resolve');
  console.log('  GET/POST /api/documents, DELETE /api/documents/:id');
  console.log('  POST /api/documents/upload');
  console.log('  GET /api/company-compliance-score/:companyNumber');
  console.log('');
});
