import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db/index';
import { deploymentStatus, leads, intakeForms, complianceBundles, contacts, users, monitoredCompanies, alerts, sessions, chCompanies } from './db/schema';
import { desc, eq, and, count, sql } from 'drizzle-orm';
import { companiesHouseService } from './services/companiesHouse';
import { companiesHouseLocalService } from './services/companiesHouseLocal';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const app = express();
const PORT = process.env.PORT || 3000;
const DEPLOY_RECORD_TOKEN = process.env.DEPLOY_RECORD_TOKEN;

// ============================================================================
// PRODUCTION MIDDLEWARE
// ============================================================================

// Trust Azure reverse proxy (App Service fronts via a load balancer)
if (IS_PRODUCTION) {
  app.set('trust proxy', 1);
}

// gzip / brotli compression – biggest single perf win for API + static assets
app.use(compression());

// CORS
app.use(cors());

// Body parsers with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Security headers (applied in production; SWA handles these for static-only deploys)
if (IS_PRODUCTION) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    next();
  });
}

// Request logging (concise in prod, verbose in dev)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (IS_PRODUCTION) {
    // Log only non-static requests in prod to reduce noise
    if (req.path.startsWith('/api') || req.path === '/health') {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    }
  } else {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await db.select().from(deploymentStatus).limit(1);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

// ============================================================================
// DEPLOYMENT TRACKING API ENDPOINTS
// ============================================================================

/**
 * POST /api/deployments/record
 * Record a new deployment status
 * Requires X-DEPLOY-TOKEN header for authentication
 */
app.post('/api/deployments/record', async (req: Request, res: Response) => {
  try {
    // Check authentication
    const token = req.headers['x-deploy-token'];
    if (!token || token !== DEPLOY_RECORD_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { environment, status, commit, workflowRun } = req.body;

    // Validate required fields
    if (!environment || !status || !commit || !workflowRun) {
      return res.status(400).json({
        error: 'Missing required fields: environment, status, commit, workflowRun',
      });
    }

    // Validate environment
    if (!['dev', 'staging', 'prod'].includes(environment)) {
      return res.status(400).json({
        error: 'Invalid environment. Must be: dev, staging, or prod',
      });
    }

    // Validate status
    if (!['success', 'failed', 'in_progress'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be: success, failed, or in_progress',
      });
    }

    // Insert deployment record
    const [deployment] = await db
      .insert(deploymentStatus)
      .values({
        environment,
        status,
        commit: commit.substring(0, 50), // Limit to 50 chars
        workflowRun: workflowRun.toString(),
      })
      .returning();

    console.log(`✅ Deployment recorded: ${environment} - ${status} - ${commit}`);

    res.status(201).json({
      success: true,
      id: deployment.id,
    });
  } catch (error) {
    console.error('Error recording deployment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/deployments/status
 * Get latest deployment status for each environment
 * Public endpoint (no authentication required)
 */
app.get('/api/deployments/status', async (req: Request, res: Response) => {
  try {
    // Get all deployments ordered by date
    const allDeployments = await db
      .select()
      .from(deploymentStatus)
      .orderBy(desc(deploymentStatus.deployedAt));

    // Get latest deployment for each environment
    const latestDeployments = new Map();
    for (const deployment of allDeployments) {
      if (!latestDeployments.has(deployment.environment)) {
        latestDeployments.set(deployment.environment, deployment);
      }
    }

    const deployments = Array.from(latestDeployments.values());

    res.json({ deployments });
  } catch (error) {
    console.error('Error fetching deployment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/deployments/history
 * Get deployment history with optional filters
 */
app.get('/api/deployments/history', async (req: Request, res: Response) => {
  try {
    const { environment, limit = '50' } = req.query;

    let query = db.select().from(deploymentStatus);

    if (environment && typeof environment === 'string') {
      query = query.where(eq(deploymentStatus.environment, environment)) as any;
    }

    const deployments = await query
      .orderBy(desc(deploymentStatus.deployedAt))
      .limit(parseInt(limit as string));

    res.json({ deployments });
  } catch (error) {
    console.error('Error fetching deployment history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// LEAD CAPTURE API ENDPOINTS
// ============================================================================

/**
 * POST /api/lead
 * Submit a demo booking lead
 */
app.post('/api/lead', async (req: Request, res: Response) => {
  try {
    const { name, email, company, product, phone, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        ok: false,
        error: 'Name and email are required',
      });
    }

    // Generate unique lead ID
    const leadId = `LEAD-${Date.now()}`;

    const [lead] = await db
      .insert(leads)
      .values({
        leadId,
        name,
        email,
        company: company || null,
        product: product || null,
        phone: phone || null,
        message: message || null,
      })
      .returning();

    console.log(`📧 New lead captured: ${name} - ${product || 'N/A'}`);

    res.status(201).json({
      ok: true,
      message: "Thank you for your interest! We'll be in touch soon.",
      leadId: lead.leadId,
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to save lead. Please try again.',
    });
  }
});

/**
 * GET /api/admin/leads
 * Get all leads (admin endpoint)
 */
app.get('/api/admin/leads', async (req: Request, res: Response) => {
  try {
    const allLeads = await db
      .select()
      .from(leads)
      .orderBy(desc(leads.createdAt));

    res.json(allLeads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// ============================================================================
// INTAKE FORM API ENDPOINTS
// ============================================================================

/**
 * POST /api/intake
 * Submit a client intake form
 */
app.post('/api/intake', async (req: Request, res: Response) => {
  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      matterType,
      urgency,
      description,
      claimValue
    } = req.body;

    if (!clientName || !matterType || !urgency) {
      return res.status(400).json({
        ok: false,
        error: 'Client name, matter type, and urgency are required',
      });
    }

    // Generate unique matter reference
    const matterRef = `MAT-${Date.now()}`;

    const [intake] = await db
      .insert(intakeForms)
      .values({
        matterRef,
        clientName,
        clientEmail: clientEmail || null,
        clientPhone: clientPhone || null,
        matterType,
        urgency,
        description: description || null,
        claimValue: claimValue || null,
      })
      .returning();

    console.log(`📋 New intake form: ${clientName} - ${matterType}`);

    res.status(201).json({
      ok: true,
      message: 'Matter intake recorded successfully',
      matterRef: intake.matterRef,
      urgency: intake.urgency,
    });
  } catch (error) {
    console.error('Error creating intake form:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to save intake form. Please try again.',
    });
  }
});

/**
 * GET /api/admin/intake-forms
 * Get all intake forms (admin endpoint)
 */
app.get('/api/admin/intake-forms', async (req: Request, res: Response) => {
  try {
    const allForms = await db
      .select()
      .from(intakeForms)
      .orderBy(desc(intakeForms.createdAt));

    res.json(allForms);
  } catch (error) {
    console.error('Error fetching intake forms:', error);
    res.status(500).json({ error: 'Failed to fetch intake forms' });
  }
});

// ============================================================================
// COMPLIANCE BUNDLE API ENDPOINTS
// ============================================================================

/**
 * POST /api/compliance-bundle
 * Submit a compliance bundle request with REAL-TIME Companies House lookup
 */
app.post('/api/compliance-bundle', async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      companyNumber,
      requestorName,
      requestorEmail,
      bundleType
    } = req.body;

    if (!companyNumber) {
      return res.status(400).json({
        ok: false,
        error: 'Company number is required',
      });
    }

    // Validate company number format
    if (!companiesHouseService.validateCompanyNumber(companyNumber)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid company number format. Must be 8 digits or 2 letters + 6 digits.',
      });
    }

    // Format company number
    const formattedNumber = companiesHouseService.formatCompanyNumber(companyNumber);

    // REAL-TIME: Fetch company profile from Companies House
    const companyProfile = await companiesHouseService.getCompanyProfile(formattedNumber);

    if (!companyProfile) {
      return res.status(404).json({
        ok: false,
        error: 'Company not found in Companies House register. Please check the company number.',
      });
    }

    // REAL-TIME: Get compliance status with deadlines
    const complianceStatus = await companiesHouseService.getComplianceStatus(formattedNumber);

    // Generate unique bundle ID
    const bundleId = `BUNDLE-${Date.now()}`;

    // Save to database with REAL company data
    const [bundle] = await db
      .insert(complianceBundles)
      .values({
        bundleId,
        companyName: companyProfile.companyName, // Use REAL name from Companies House
        companyNumber: formattedNumber,
        requestorName: requestorName || null,
        requestorEmail: requestorEmail || null,
        bundleType: bundleType || 'full',
        estimatedTime: 'Generated instantly', // No longer fake - we have real data!
      })
      .returning();

    console.log(`📦 Real-time compliance check: ${companyProfile.companyName} (${formattedNumber})`);
    console.log(`   Status: ${complianceStatus.status.toUpperCase()}`);
    console.log(`   Risk Level: ${complianceStatus.riskLevel.toUpperCase()}`);
    console.log(`   Overdue Filings: ${complianceStatus.overdueFilings.length}`);
    console.log(`   Upcoming Deadlines: ${complianceStatus.upcomingDeadlines.length}`);

    res.status(201).json({
      ok: true,
      message: 'Real-time compliance check complete',
      bundleId: bundle.bundleId,

      // REAL DATA from Companies House:
      company: {
        number: companyProfile.companyNumber,
        name: companyProfile.companyName,
        status: companyProfile.companyStatus,
        type: companyProfile.type,
        incorporationDate: companyProfile.dateOfCreation,
      },

      compliance: {
        status: complianceStatus.status,
        riskLevel: complianceStatus.riskLevel,

        accounts: {
          nextDue: complianceStatus.accountsStatus.nextDue,
          daysUntilDue: complianceStatus.accountsStatus.daysUntilDue,
          overdue: complianceStatus.accountsStatus.overdue,
        },

        confirmationStatement: {
          nextDue: complianceStatus.confirmationStatementStatus.nextDue,
          daysUntilDue: complianceStatus.confirmationStatementStatus.daysUntilDue,
          overdue: complianceStatus.confirmationStatementStatus.overdue,
        },

        overdueFilings: complianceStatus.overdueFilings.map(f => ({
          type: f.type,
          description: f.description,
          dueDate: f.dueDate,
          daysOverdue: Math.abs(f.daysUntilDue),
          penaltyRisk: f.penaltyRisk,
        })),

        upcomingDeadlines: complianceStatus.upcomingDeadlines.map(d => ({
          type: d.type,
          description: d.description,
          dueDate: d.dueDate,
          daysUntilDue: d.daysUntilDue,
        })),

        penalties: complianceStatus.penalties,
      },
    });
  } catch (error) {
    console.error('Error fetching Companies House data:', error);

    // Check if it's an API key error
    if (error instanceof Error && error.message.includes('COMPANIES_HOUSE_API_KEY')) {
      return res.status(500).json({
        ok: false,
        error: 'Companies House API not configured. Please contact support.',
      });
    }

    res.status(500).json({
      ok: false,
      error: 'Failed to fetch company information. Please try again.',
    });
  }
});

/**
 * GET /api/admin/compliance-bundles
 * Get all compliance bundle requests (admin endpoint)
 */
app.get('/api/admin/compliance-bundles', async (req: Request, res: Response) => {
  try {
    const allBundles = await db
      .select()
      .from(complianceBundles)
      .orderBy(desc(complianceBundles.createdAt));

    res.json(allBundles);
  } catch (error) {
    console.error('Error fetching compliance bundles:', error);
    res.status(500).json({ error: 'Failed to fetch compliance bundles' });
  }
});

// ============================================================================
// CONTACT FORM API ENDPOINTS
// ============================================================================

/**
 * POST /api/contact
 * Submit a contact form
 */
app.post('/api/contact', async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        error: 'Name, email, and message are required',
      });
    }

    // Generate unique ticket ID
    const ticketId = `TICKET-${Date.now()}`;

    const [contact] = await db
      .insert(contacts)
      .values({
        ticketId,
        name,
        email,
        subject: subject || null,
        message,
        status: 'new',
      })
      .returning();

    console.log(`💬 New contact: ${name}`);

    res.status(201).json({
      ok: true,
      message: "Thank you for contacting us. We'll respond within 24 hours.",
      ticketId: contact.ticketId,
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to save contact form. Please try again.',
    });
  }
});

/**
 * GET /api/admin/contacts
 * Get all contacts (admin endpoint)
 */
app.get('/api/admin/contacts', async (req: Request, res: Response) => {
  try {
    const allContacts = await db
      .select()
      .from(contacts)
      .orderBy(desc(contacts.createdAt));

    res.json(allContacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

/**
 * PATCH /api/contacts/:id
 * Update contact status
 */
app.patch('/api/contacts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be: new, read, or replied',
      });
    }

    const [contact] = await db
      .update(contacts)
      .set({ status })
      .where(eq(contacts.id, id))
      .returning();

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ success: true, contact });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// FINEGUARD PRO - AUTH HELPERS
// ============================================================================

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const verify = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === verify;
}

function generateToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

async function authenticateRequest(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session || new Date(session.expiresAt) < new Date()) return null;
  return { userId: session.userId };
}

// ============================================================================
// FINEGUARD PRO - USER AUTH ENDPOINTS
// ============================================================================

/**
 * POST /api/auth/register
 * Register a new FineGuard Pro user
 */
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, name, company, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ ok: false, error: 'Email, name, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters' });
    }

    // Check if email already registered
    const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing) {
      return res.status(409).json({ ok: false, error: 'Email already registered' });
    }

    const passwordHash = hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        name,
        company: company || null,
        passwordHash,
      })
      .returning();

    // Create session
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt,
    });

    console.log(`🆕 New user registered: ${email}`);

    res.status(201).json({
      ok: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, company: user.company, plan: user.plan },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ ok: false, error: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Login an existing user
 */
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password are required' });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    // Create session
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({ userId: user.id, token, expiresAt });

    console.log(`🔑 User logged in: ${email}`);

    res.json({
      ok: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, company: user.company, plan: user.plan },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ ok: false, error: 'Login failed. Please try again.' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
app.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const [user] = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

    res.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, company: user.company, plan: user.plan, role: user.role, createdAt: user.createdAt },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch user' });
  }
});

/**
 * POST /api/auth/logout
 * Logout current session
 */
app.post('/api/auth/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      await db.delete(sessions).where(eq(sessions.token, token));
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Logout failed' });
  }
});

// ============================================================================
// FINEGUARD PRO - COMPANY SEARCH (BULK DATA)
// Must be registered BEFORE /api/companies/:id to avoid Express matching
// "search" as an :id parameter.
// ============================================================================

/**
 * GET /api/companies/search?q=<query>&limit=20
 * Search companies from local bulk data (BasicCompanyDataAsOneFile)
 */
app.get('/api/companies/search', async (req: Request, res: Response) => {
  try {
    const { q, limit = '20', by = 'name' } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(400).json({ ok: false, error: 'Search query must be at least 2 characters' });
    }

    const maxLimit = Math.min(parseInt(limit as string) || 20, 100);
    let results;

    switch (by) {
      case 'number':
        const single = await companiesHouseLocalService.getByNumber(q);
        results = single ? [single] : [];
        break;
      case 'postcode':
        results = await companiesHouseLocalService.searchByPostcode(q, maxLimit);
        break;
      case 'sic':
        results = await companiesHouseLocalService.searchBySicCode(q, maxLimit);
        break;
      default:
        results = await companiesHouseLocalService.searchByName(q, maxLimit);
    }

    res.json({ ok: true, count: results.length, results });
  } catch (error) {
    console.error('Error searching companies:', error);
    res.status(500).json({ ok: false, error: 'Search failed' });
  }
});

// ============================================================================
// FINEGUARD PRO - COMPANY MONITORING ENDPOINTS
// ============================================================================

/**
 * GET /api/companies
 * List user's monitored companies
 */
app.get('/api/companies', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const companies = await db
      .select()
      .from(monitoredCompanies)
      .where(eq(monitoredCompanies.userId, auth.userId))
      .orderBy(desc(monitoredCompanies.createdAt));

    res.json({ ok: true, companies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch companies' });
  }
});

/**
 * POST /api/companies
 * Add a company to monitoring - performs live Companies House lookup
 */
app.post('/api/companies', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { companyNumber, notes } = req.body;

    if (!companyNumber) {
      return res.status(400).json({ ok: false, error: 'Company number is required' });
    }

    if (!companiesHouseService.validateCompanyNumber(companyNumber)) {
      return res.status(400).json({ ok: false, error: 'Invalid company number format' });
    }

    const formattedNumber = companiesHouseService.formatCompanyNumber(companyNumber);

    // Check if already monitoring
    const [existing] = await db
      .select()
      .from(monitoredCompanies)
      .where(and(
        eq(monitoredCompanies.userId, auth.userId),
        eq(monitoredCompanies.companyNumber, formattedNumber),
      ))
      .limit(1);

    if (existing) {
      return res.status(409).json({ ok: false, error: 'Company is already in your portfolio' });
    }

    // Fetch live data from Companies House
    const profile = await companiesHouseService.getCompanyProfile(formattedNumber);
    if (!profile) {
      return res.status(404).json({ ok: false, error: 'Company not found in Companies House register' });
    }

    const compliance = await companiesHouseService.getComplianceStatus(formattedNumber);

    const [company] = await db
      .insert(monitoredCompanies)
      .values({
        userId: auth.userId,
        companyNumber: formattedNumber,
        companyName: profile.companyName,
        companyStatus: profile.companyStatus,
        complianceStatus: compliance.status,
        riskLevel: compliance.riskLevel,
        lastCheckedAt: new Date(),
        accountsNextDue: compliance.accountsStatus.nextDue,
        confirmationNextDue: compliance.confirmationStatementStatus.nextDue,
        notes: notes || null,
      })
      .returning();

    // Create initial alerts for any issues found
    if (compliance.overdueFilings.length > 0) {
      for (const filing of compliance.overdueFilings) {
        await db.insert(alerts).values({
          userId: auth.userId,
          companyId: company.id,
          type: 'overdue',
          severity: 'critical',
          title: `${filing.description} overdue for ${profile.companyName}`,
          message: `The ${filing.description} was due on ${filing.dueDate} and is now ${Math.abs(filing.daysUntilDue)} days overdue. Estimated penalty: £${filing.penaltyRisk || 0}.`,
        });
      }
    }

    if (compliance.upcomingDeadlines.length > 0) {
      for (const deadline of compliance.upcomingDeadlines) {
        await db.insert(alerts).values({
          userId: auth.userId,
          companyId: company.id,
          type: 'deadline_warning',
          severity: deadline.daysUntilDue <= 7 ? 'warning' : 'info',
          title: `${deadline.description} due soon for ${profile.companyName}`,
          message: `The ${deadline.description} is due on ${deadline.dueDate} (${deadline.daysUntilDue} days remaining).`,
        });
      }
    }

    console.log(`📌 Company added to monitoring: ${profile.companyName} (${formattedNumber})`);

    res.status(201).json({
      ok: true,
      company,
      compliance: {
        status: compliance.status,
        riskLevel: compliance.riskLevel,
        accounts: compliance.accountsStatus,
        confirmationStatement: compliance.confirmationStatementStatus,
        overdueFilings: compliance.overdueFilings,
        upcomingDeadlines: compliance.upcomingDeadlines,
        penalties: compliance.penalties,
      },
    });
  } catch (error) {
    console.error('Error adding company:', error);

    if (error instanceof Error && error.message.includes('COMPANIES_HOUSE_API_KEY')) {
      return res.status(500).json({ ok: false, error: 'Companies House API not configured' });
    }

    res.status(500).json({ ok: false, error: 'Failed to add company. Please try again.' });
  }
});

/**
 * GET /api/companies/:id
 * Get detailed compliance info for a monitored company
 */
app.get('/api/companies/:id', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { id } = req.params;

    const [company] = await db
      .select()
      .from(monitoredCompanies)
      .where(and(eq(monitoredCompanies.id, id), eq(monitoredCompanies.userId, auth.userId)))
      .limit(1);

    if (!company) {
      return res.status(404).json({ ok: false, error: 'Company not found' });
    }

    // Fetch fresh compliance data
    let compliance = null;
    try {
      compliance = await companiesHouseService.getComplianceStatus(company.companyNumber);

      // Update stored status
      await db
        .update(monitoredCompanies)
        .set({
          complianceStatus: compliance.status,
          riskLevel: compliance.riskLevel,
          lastCheckedAt: new Date(),
          accountsNextDue: compliance.accountsStatus.nextDue,
          confirmationNextDue: compliance.confirmationStatementStatus.nextDue,
        })
        .where(eq(monitoredCompanies.id, id));
    } catch (e) {
      // If CH API fails, return cached data
      console.warn('Companies House API unavailable, using cached data');
    }

    // Get alerts for this company
    const companyAlerts = await db
      .select()
      .from(alerts)
      .where(and(eq(alerts.companyId, id), eq(alerts.userId, auth.userId)))
      .orderBy(desc(alerts.createdAt))
      .limit(20);

    res.json({
      ok: true,
      company,
      compliance: compliance ? {
        status: compliance.status,
        riskLevel: compliance.riskLevel,
        accounts: compliance.accountsStatus,
        confirmationStatement: compliance.confirmationStatementStatus,
        overdueFilings: compliance.overdueFilings,
        upcomingDeadlines: compliance.upcomingDeadlines,
        penalties: compliance.penalties,
        lastFiling: compliance.lastFiling,
      } : null,
      alerts: companyAlerts,
    });
  } catch (error) {
    console.error('Error fetching company detail:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch company details' });
  }
});

/**
 * DELETE /api/companies/:id
 * Remove a company from monitoring
 */
app.delete('/api/companies/:id', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { id } = req.params;

    // Delete alerts first (FK constraint)
    await db.delete(alerts).where(and(eq(alerts.companyId, id), eq(alerts.userId, auth.userId)));

    const [deleted] = await db
      .delete(monitoredCompanies)
      .where(and(eq(monitoredCompanies.id, id), eq(monitoredCompanies.userId, auth.userId)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'Company not found' });
    }

    console.log(`🗑️ Company removed from monitoring: ${deleted.companyName}`);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ ok: false, error: 'Failed to remove company' });
  }
});

/**
 * POST /api/companies/:id/refresh
 * Refresh compliance data from Companies House
 */
app.post('/api/companies/:id/refresh', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { id } = req.params;

    const [company] = await db
      .select()
      .from(monitoredCompanies)
      .where(and(eq(monitoredCompanies.id, id), eq(monitoredCompanies.userId, auth.userId)))
      .limit(1);

    if (!company) {
      return res.status(404).json({ ok: false, error: 'Company not found' });
    }

    const compliance = await companiesHouseService.getComplianceStatus(company.companyNumber);

    await db
      .update(monitoredCompanies)
      .set({
        complianceStatus: compliance.status,
        riskLevel: compliance.riskLevel,
        lastCheckedAt: new Date(),
        accountsNextDue: compliance.accountsStatus.nextDue,
        confirmationNextDue: compliance.confirmationStatementStatus.nextDue,
      })
      .where(eq(monitoredCompanies.id, id));

    res.json({ ok: true, compliance });
  } catch (error) {
    console.error('Error refreshing company:', error);
    res.status(500).json({ ok: false, error: 'Failed to refresh compliance data' });
  }
});

/**
 * GET /api/bulk-data/stats
 * Get statistics about the imported bulk data
 */
app.get('/api/bulk-data/stats', async (req: Request, res: Response) => {
  try {
    const isLoaded = await companiesHouseLocalService.isDataLoaded();

    if (!isLoaded) {
      return res.json({
        ok: true,
        loaded: false,
        totalCompanies: 0,
        message: 'No bulk data imported yet. Run: pnpm db:import <path-to-csv>',
      });
    }

    const totalCount = await companiesHouseLocalService.getTotalCount();
    const statusCounts = await companiesHouseLocalService.getStatusCounts();

    res.json({
      ok: true,
      loaded: true,
      totalCompanies: totalCount,
      statusBreakdown: statusCounts,
    });
  } catch (error) {
    console.error('Error fetching bulk data stats:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/bulk-data/overdue?limit=50
 * Get companies with overdue accounts from bulk data
 */
app.get('/api/bulk-data/overdue', async (req: Request, res: Response) => {
  try {
    const { limit = '50' } = req.query;
    const maxLimit = Math.min(parseInt(limit as string) || 50, 200);

    const results = await companiesHouseLocalService.getOverdueCompanies(maxLimit);

    res.json({ ok: true, count: results.length, results });
  } catch (error) {
    console.error('Error fetching overdue companies:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch overdue companies' });
  }
});

// ============================================================================
// FINEGUARD PRO - ALERTS ENDPOINTS
// ============================================================================

/**
 * GET /api/alerts
 * List user's alerts
 */
app.get('/api/alerts', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const userAlerts = await db
      .select()
      .from(alerts)
      .where(eq(alerts.userId, auth.userId))
      .orderBy(desc(alerts.createdAt))
      .limit(50);

    res.json({ ok: true, alerts: userAlerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch alerts' });
  }
});

/**
 * PATCH /api/alerts/:id/read
 * Mark an alert as read
 */
app.patch('/api/alerts/:id/read', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const [alert] = await db
      .update(alerts)
      .set({ read: true })
      .where(and(eq(alerts.id, req.params.id), eq(alerts.userId, auth.userId)))
      .returning();

    if (!alert) return res.status(404).json({ ok: false, error: 'Alert not found' });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to update alert' });
  }
});

/**
 * POST /api/alerts/read-all
 * Mark all alerts as read
 */
app.post('/api/alerts/read-all', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    await db.update(alerts).set({ read: true }).where(eq(alerts.userId, auth.userId));
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to mark alerts as read' });
  }
});

/**
 * GET /api/dashboard
 * Get dashboard stats for current user
 */
app.get('/api/dashboard', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const companies = await db
      .select()
      .from(monitoredCompanies)
      .where(eq(monitoredCompanies.userId, auth.userId));

    const unreadAlerts = await db
      .select()
      .from(alerts)
      .where(and(eq(alerts.userId, auth.userId), eq(alerts.read, false)));

    const totalCompanies = companies.length;
    const compliantCount = companies.filter(c => c.complianceStatus === 'compliant').length;
    const warningCount = companies.filter(c => c.complianceStatus === 'warning').length;
    const overdueCount = companies.filter(c => c.complianceStatus === 'overdue').length;
    const highRiskCount = companies.filter(c => c.riskLevel === 'high').length;

    res.json({
      ok: true,
      stats: {
        totalCompanies,
        compliantCount,
        warningCount,
        overdueCount,
        highRiskCount,
        unreadAlerts: unreadAlerts.length,
      },
      companies,
      recentAlerts: unreadAlerts.slice(0, 5),
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch dashboard' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await db.select().from(deploymentStatus).limit(1);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

// ============================================================================
// STATIC FILE SERVING & SPA FALLBACK
// ============================================================================

// Serve static files from dist folder with aggressive caching for hashed assets
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath, {
  maxAge: IS_PRODUCTION ? '1y' : 0,       // Vite adds content hashes → safe to cache forever
  immutable: IS_PRODUCTION,
  etag: true,
  index: false,                             // We handle SPA fallback ourselves
}));

// SPA fallback - serve index.html for all other routes (never cached)
app.get('*', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  res.sendFile(path.join(distPath, 'index.html'));
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// START SERVER & GRACEFUL SHUTDOWN
// ============================================================================

const server = app.listen(PORT, () => {
  console.log('');
  console.log(`VaultLine Brand Suite Server [${IS_PRODUCTION ? 'PRODUCTION' : 'DEV'}]`);
  console.log('================================');
  console.log(`Server running on port ${PORT}`);
  if (!IS_PRODUCTION) console.log(`http://localhost:${PORT}`);
  console.log('');
});

// Graceful shutdown for Azure App Service (SIGTERM) and Docker (SIGINT)
function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received – shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  // Force exit after 10s if connections don't drain
  setTimeout(() => {
    console.warn('Forcing shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
