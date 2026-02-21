import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db/index';
import { deploymentStatus, leads, intakeForms, complianceBundles, contacts, users, monitoredCompanies, alerts, sessions, chCompanies, acspClients, acspFilings, teamMembers, workflows, workflowTasks, importHistory } from './db/schema';
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

// Security headers (matches staticwebapp.config.json globalHeaders for parity)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';");
  if (IS_PRODUCTION) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  next();
});

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
    const { email, name, company, password, intent } = req.body;

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
        userIntent: intent || null,
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
      user: { id: user.id, email: user.email, name: user.name, company: user.company, plan: user.plan, userIntent: user.userIntent, onboardingComplete: user.onboardingComplete },
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
      user: { id: user.id, email: user.email, name: user.name, company: user.company, plan: user.plan, role: user.role, userIntent: user.userIntent, onboardingComplete: user.onboardingComplete, notificationPrefs: user.notificationPrefs, createdAt: user.createdAt },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch user' });
  }
});

/**
 * PATCH /api/auth/me
 * Update current user profile
 */
app.patch('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const allowedFields = ['name', 'company', 'userIntent', 'onboardingComplete'] as const;
    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        if (key === 'userIntent') updates['userIntent'] = req.body[key];
        else if (key === 'onboardingComplete') updates['onboardingComplete'] = req.body[key];
        else updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ ok: false, error: 'No valid fields to update' });
    }

    const [user] = await db.update(users).set(updates).where(eq(users.id, auth.userId)).returning();
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

    res.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, company: user.company, plan: user.plan, role: user.role, userIntent: user.userIntent, onboardingComplete: user.onboardingComplete, notificationPrefs: user.notificationPrefs, createdAt: user.createdAt },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ ok: false, error: 'Failed to update profile' });
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

/**
 * PATCH /api/auth/password
 * Change password for authenticated user
 */
app.patch('/api/auth/password', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ ok: false, error: 'currentPassword and newPassword are required' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ ok: false, error: 'New password must be at least 8 characters' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
    if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
      return res.status(400).json({ ok: false, error: 'Current password is incorrect' });
    }

    await db.update(users).set({ passwordHash: hashPassword(newPassword) }).where(eq(users.id, auth.userId));
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to update password' });
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
 * PATCH /api/alerts/preferences
 * Save notification preference toggles for authenticated user
 */
app.patch('/api/alerts/preferences', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { prefs } = req.body;
    if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) {
      return res.status(400).json({ ok: false, error: 'prefs must be an object' });
    }

    await db.update(users).set({ notificationPrefs: prefs }).where(eq(users.id, auth.userId));
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to save preferences' });
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
// ACSP (Authorised Corporate Service Provider) ENDPOINTS
// ============================================================================

/**
 * GET /api/acsp/clients
 * List ACSP clients for the current user
 */
app.get('/api/acsp/clients', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const clients = await db
      .select()
      .from(acspClients)
      .where(eq(acspClients.userId, auth.userId))
      .orderBy(desc(acspClients.createdAt));

    res.json({ ok: true, clients });
  } catch (error) {
    console.error('Error fetching ACSP clients:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch ACSP clients' });
  }
});

/**
 * POST /api/acsp/clients
 * Add a new ACSP client
 */
app.post('/api/acsp/clients', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { companyNumber, companyName, clientRef, serviceType, acspRegNumber, notes } = req.body;

    if (!companyNumber || !companyName || !serviceType) {
      return res.status(400).json({ ok: false, error: 'companyNumber, companyName, and serviceType are required' });
    }

    const [client] = await db
      .insert(acspClients)
      .values({
        userId: auth.userId,
        companyNumber: companyNumber.toUpperCase().replace(/\s/g, ''),
        companyName,
        clientRef: clientRef || null,
        serviceType,
        acspRegNumber: acspRegNumber || null,
        notes: notes || null,
      })
      .returning();

    res.status(201).json({ ok: true, client });
  } catch (error) {
    console.error('Error adding ACSP client:', error);
    res.status(500).json({ ok: false, error: 'Failed to add ACSP client' });
  }
});

/**
 * PATCH /api/acsp/clients/:id
 * Update an ACSP client
 */
app.patch('/api/acsp/clients/:id', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { id } = req.params;
    const updates = req.body;

    const [client] = await db
      .update(acspClients)
      .set(updates)
      .where(and(eq(acspClients.id, id), eq(acspClients.userId, auth.userId)))
      .returning();

    if (!client) return res.status(404).json({ ok: false, error: 'Client not found' });

    res.json({ ok: true, client });
  } catch (error) {
    console.error('Error updating ACSP client:', error);
    res.status(500).json({ ok: false, error: 'Failed to update ACSP client' });
  }
});

/**
 * DELETE /api/acsp/clients/:id
 * Remove an ACSP client
 */
app.delete('/api/acsp/clients/:id', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    // Delete associated filings first
    const clientFilings = await db
      .select()
      .from(acspFilings)
      .where(eq(acspFilings.acspClientId, req.params.id));

    if (clientFilings.length > 0) {
      await db.delete(acspFilings).where(eq(acspFilings.acspClientId, req.params.id));
    }

    const [deleted] = await db
      .delete(acspClients)
      .where(and(eq(acspClients.id, req.params.id), eq(acspClients.userId, auth.userId)))
      .returning();

    if (!deleted) return res.status(404).json({ ok: false, error: 'Client not found' });

    res.json({ ok: true, deleted: true });
  } catch (error) {
    console.error('Error deleting ACSP client:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete ACSP client' });
  }
});

/**
 * GET /api/acsp/filings
 * List filings for a client (or all filings)
 */
app.get('/api/acsp/filings', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { clientId } = req.query;

    let filings;
    if (clientId && typeof clientId === 'string') {
      filings = await db
        .select()
        .from(acspFilings)
        .where(and(eq(acspFilings.userId, auth.userId), eq(acspFilings.acspClientId, clientId)))
        .orderBy(desc(acspFilings.createdAt));
    } else {
      filings = await db
        .select()
        .from(acspFilings)
        .where(eq(acspFilings.userId, auth.userId))
        .orderBy(desc(acspFilings.createdAt));
    }

    res.json({ ok: true, filings });
  } catch (error) {
    console.error('Error fetching ACSP filings:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch filings' });
  }
});

/**
 * POST /api/acsp/filings
 * Create a new filing for an ACSP client
 */
app.post('/api/acsp/filings', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { acspClientId, filingType, dueDate, notes } = req.body;

    if (!acspClientId || !filingType) {
      return res.status(400).json({ ok: false, error: 'acspClientId and filingType are required' });
    }

    const [filing] = await db
      .insert(acspFilings)
      .values({
        acspClientId,
        userId: auth.userId,
        filingType,
        dueDate: dueDate || null,
        notes: notes || null,
      })
      .returning();

    res.status(201).json({ ok: true, filing });
  } catch (error) {
    console.error('Error creating filing:', error);
    res.status(500).json({ ok: false, error: 'Failed to create filing' });
  }
});

/**
 * PATCH /api/acsp/filings/:id
 * Update a filing status
 */
app.patch('/api/acsp/filings/:id', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { status, referenceNumber, submittedAt, notes } = req.body;
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (referenceNumber) updateData.referenceNumber = referenceNumber;
    if (submittedAt) updateData.submittedAt = new Date(submittedAt);
    if (notes !== undefined) updateData.notes = notes;

    const [filing] = await db
      .update(acspFilings)
      .set(updateData)
      .where(and(eq(acspFilings.id, req.params.id), eq(acspFilings.userId, auth.userId)))
      .returning();

    if (!filing) return res.status(404).json({ ok: false, error: 'Filing not found' });

    res.json({ ok: true, filing });
  } catch (error) {
    console.error('Error updating filing:', error);
    res.status(500).json({ ok: false, error: 'Failed to update filing' });
  }
});

/**
 * GET /api/acsp/dashboard
 * ACSP overview dashboard stats
 */
app.get('/api/acsp/dashboard', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const clients = await db
      .select()
      .from(acspClients)
      .where(eq(acspClients.userId, auth.userId));

    const filings = await db
      .select()
      .from(acspFilings)
      .where(eq(acspFilings.userId, auth.userId));

    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'active').length;
    const verifiedClients = clients.filter(c => c.identityVerified).length;
    const amlCheckedClients = clients.filter(c => c.amlChecked).length;
    const pendingFilings = filings.filter(f => f.status === 'pending').length;
    const submittedFilings = filings.filter(f => f.status === 'submitted').length;

    const serviceBreakdown: Record<string, number> = {};
    for (const c of clients) {
      serviceBreakdown[c.serviceType] = (serviceBreakdown[c.serviceType] || 0) + 1;
    }

    res.json({
      ok: true,
      stats: {
        totalClients,
        activeClients,
        verifiedClients,
        amlCheckedClients,
        pendingFilings,
        submittedFilings,
        totalFilings: filings.length,
        serviceBreakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching ACSP dashboard:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch ACSP dashboard' });
  }
});

// ============================================================================
// ACSP BULK IMPORT ENDPOINTS
// ============================================================================

/**
 * POST /api/acsp/clients/bulk
 * Bulk-create ACSP clients from spreadsheet import
 */
app.post('/api/acsp/clients/bulk', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { clients, fileName, columnMapping } = req.body;

    if (!Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({ ok: false, error: 'clients array is required' });
    }
    if (clients.length > 500) {
      return res.status(400).json({ ok: false, error: 'Maximum 500 clients per import' });
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const results: Array<{ row: number; status: string; error?: string; client?: any }> = [];

    for (let i = 0; i < clients.length; i++) {
      const c = clients[i];
      try {
        if (!c.companyNumber || !c.companyName || !c.serviceType) {
          results.push({ row: i + 1, status: 'skipped', error: 'Missing required fields (companyNumber, companyName, serviceType)' });
          skipped++;
          continue;
        }

        const normalizedNumber = c.companyNumber.toString().toUpperCase().replace(/\s/g, '');

        // Check for duplicate
        const [existing] = await db.select().from(acspClients)
          .where(and(
            eq(acspClients.userId, auth.userId),
            eq(acspClients.companyNumber, normalizedNumber)
          )).limit(1);

        if (existing) {
          results.push({ row: i + 1, status: 'skipped', error: 'Duplicate company number' });
          skipped++;
          continue;
        }

        const [client] = await db.insert(acspClients).values({
          userId: auth.userId,
          companyNumber: normalizedNumber,
          companyName: c.companyName,
          clientRef: c.clientRef || null,
          serviceType: c.serviceType,
          acspRegNumber: c.acspRegNumber || null,
          identityVerified: c.identityVerified || false,
          amlChecked: c.amlChecked || false,
          lastFilingDate: c.lastFilingDate || null,
          nextFilingDue: c.nextFilingDue || null,
          notes: c.notes || null,
        }).returning();

        results.push({ row: i + 1, status: 'imported', client });
        imported++;
      } catch (err) {
        results.push({ row: i + 1, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
        errors++;
      }
    }

    // Record import history
    await db.insert(importHistory).values({
      userId: auth.userId,
      fileName: fileName || 'Unknown',
      totalRows: clients.length,
      importedRows: imported,
      skippedRows: skipped,
      errorRows: errors,
      importType: 'acsp_clients',
      columnMapping: columnMapping ? JSON.stringify(columnMapping) : null,
    });

    res.status(201).json({
      ok: true,
      summary: { total: clients.length, imported, skipped, errors },
      results,
    });
  } catch (error) {
    console.error('Error bulk importing clients:', error);
    res.status(500).json({ ok: false, error: 'Bulk import failed' });
  }
});

/**
 * POST /api/acsp/import-with-workflow
 * Bulk-create ACSP clients and create a workflow with tasks
 */
app.post('/api/acsp/import-with-workflow', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { clients, workflowTitle, workflowType, assignedTo, taskTemplate, fileName, columnMapping } = req.body;

    if (!Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({ ok: false, error: 'clients array is required' });
    }
    if (clients.length > 500) {
      return res.status(400).json({ ok: false, error: 'Maximum 500 clients per import' });
    }

    // Bulk-create clients
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const importedClients: any[] = [];
    const results: Array<{ row: number; status: string; error?: string; client?: any }> = [];

    for (let i = 0; i < clients.length; i++) {
      const c = clients[i];
      try {
        if (!c.companyNumber || !c.companyName || !c.serviceType) {
          results.push({ row: i + 1, status: 'skipped', error: 'Missing required fields' });
          skipped++;
          continue;
        }

        const normalizedNumber = c.companyNumber.toString().toUpperCase().replace(/\s/g, '');

        const [existing] = await db.select().from(acspClients)
          .where(and(
            eq(acspClients.userId, auth.userId),
            eq(acspClients.companyNumber, normalizedNumber)
          )).limit(1);

        if (existing) {
          results.push({ row: i + 1, status: 'skipped', error: 'Duplicate company number' });
          skipped++;
          continue;
        }

        const [client] = await db.insert(acspClients).values({
          userId: auth.userId,
          companyNumber: normalizedNumber,
          companyName: c.companyName,
          clientRef: c.clientRef || null,
          serviceType: c.serviceType,
          acspRegNumber: c.acspRegNumber || null,
          identityVerified: c.identityVerified || false,
          amlChecked: c.amlChecked || false,
          lastFilingDate: c.lastFilingDate || null,
          nextFilingDue: c.nextFilingDue || null,
          notes: c.notes || null,
        }).returning();

        results.push({ row: i + 1, status: 'imported', client });
        importedClients.push(client);
        imported++;
      } catch (err) {
        results.push({ row: i + 1, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
        errors++;
      }
    }

    // Create workflow
    const [wf] = await db.insert(workflows).values({
      userId: auth.userId,
      title: workflowTitle || `Import: ${fileName || 'XLSX Import'}`,
      description: `Bulk import of ${clients.length} clients from ${fileName || 'spreadsheet'}`,
      workflowType: workflowType || 'onboarding',
      status: 'active',
      priority: 'medium',
      assignedTo: assignedTo || null,
    }).returning();

    // Create tasks for each imported client
    for (const client of importedClients) {
      await db.insert(workflowTasks).values({
        workflowId: wf.id,
        title: taskTemplate?.title
          ? taskTemplate.title.replace('{companyName}', client.companyName)
          : `Review: ${client.companyName}`,
        description: taskTemplate?.description || null,
        companyNumber: client.companyNumber,
        companyName: client.companyName,
        assignedTo: assignedTo || null,
        priority: 'medium',
      });
    }

    // Record import history
    await db.insert(importHistory).values({
      userId: auth.userId,
      fileName: fileName || 'Unknown',
      totalRows: clients.length,
      importedRows: imported,
      skippedRows: skipped,
      errorRows: errors,
      importType: 'acsp_clients',
      columnMapping: columnMapping ? JSON.stringify(columnMapping) : null,
      workflowId: wf.id,
    });

    res.status(201).json({
      ok: true,
      summary: { total: clients.length, imported, skipped, errors },
      results,
      workflow: wf,
    });
  } catch (error) {
    console.error('Error in import-with-workflow:', error);
    res.status(500).json({ ok: false, error: 'Import with workflow failed' });
  }
});

/**
 * GET /api/acsp/imports
 * Fetch import history for current user
 */
app.get('/api/acsp/imports', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const history = await db.select().from(importHistory)
      .where(eq(importHistory.userId, auth.userId))
      .orderBy(desc(importHistory.createdAt))
      .limit(20);

    res.json({ ok: true, imports: history });
  } catch (error) {
    console.error('Error fetching import history:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch import history' });
  }
});

// ============================================================================
// BUSINESS WORKFLOW & TEAM MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/team
 * List team members
 */
app.get('/api/team', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const members = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, auth.userId))
      .orderBy(teamMembers.name);

    res.json({ ok: true, members });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch team' });
  }
});

/**
 * POST /api/team
 * Add a team member
 */
app.post('/api/team', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { name, email, role, department } = req.body;

    if (!name || !email) {
      return res.status(400).json({ ok: false, error: 'name and email are required' });
    }

    const [member] = await db
      .insert(teamMembers)
      .values({
        userId: auth.userId,
        name,
        email,
        role: role || 'analyst',
        department: department || null,
      })
      .returning();

    res.status(201).json({ ok: true, member });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ ok: false, error: 'Failed to add team member' });
  }
});

/**
 * DELETE /api/team/:id
 * Remove a team member
 */
app.delete('/api/team/:id', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const [deleted] = await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.id, req.params.id), eq(teamMembers.userId, auth.userId)))
      .returning();

    if (!deleted) return res.status(404).json({ ok: false, error: 'Team member not found' });

    res.json({ ok: true, deleted: true });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete team member' });
  }
});

/**
 * GET /api/workflows
 * List workflows
 */
app.get('/api/workflows', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const wfs = await db
      .select()
      .from(workflows)
      .where(eq(workflows.userId, auth.userId))
      .orderBy(desc(workflows.createdAt));

    res.json({ ok: true, workflows: wfs });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch workflows' });
  }
});

/**
 * POST /api/workflows
 * Create a new workflow
 */
app.post('/api/workflows', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { title, description, workflowType, priority, assignedTo, dueDate } = req.body;

    if (!title || !workflowType) {
      return res.status(400).json({ ok: false, error: 'title and workflowType are required' });
    }

    const [wf] = await db
      .insert(workflows)
      .values({
        userId: auth.userId,
        title,
        description: description || null,
        workflowType,
        priority: priority || 'medium',
        assignedTo: assignedTo || null,
        dueDate: dueDate || null,
      })
      .returning();

    res.status(201).json({ ok: true, workflow: wf });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ ok: false, error: 'Failed to create workflow' });
  }
});

/**
 * PATCH /api/workflows/:id
 * Update workflow status or details
 */
app.patch('/api/workflows/:id', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const updates = req.body;
    if (updates.status === 'completed') {
      updates.completedAt = new Date();
    }

    const [wf] = await db
      .update(workflows)
      .set(updates)
      .where(and(eq(workflows.id, req.params.id), eq(workflows.userId, auth.userId)))
      .returning();

    if (!wf) return res.status(404).json({ ok: false, error: 'Workflow not found' });

    res.json({ ok: true, workflow: wf });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ ok: false, error: 'Failed to update workflow' });
  }
});

/**
 * DELETE /api/workflows/:id
 * Delete a workflow and its tasks
 */
app.delete('/api/workflows/:id', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    // Delete tasks first
    await db.delete(workflowTasks).where(eq(workflowTasks.workflowId, req.params.id));

    const [deleted] = await db
      .delete(workflows)
      .where(and(eq(workflows.id, req.params.id), eq(workflows.userId, auth.userId)))
      .returning();

    if (!deleted) return res.status(404).json({ ok: false, error: 'Workflow not found' });

    res.json({ ok: true, deleted: true });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete workflow' });
  }
});

/**
 * GET /api/workflows/:id/tasks
 * List tasks for a workflow
 */
app.get('/api/workflows/:id/tasks', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const tasks = await db
      .select()
      .from(workflowTasks)
      .where(eq(workflowTasks.workflowId, req.params.id))
      .orderBy(workflowTasks.createdAt);

    res.json({ ok: true, tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch tasks' });
  }
});

/**
 * POST /api/workflows/:id/tasks
 * Add a task to a workflow
 */
app.post('/api/workflows/:id/tasks', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { title, description, assignedTo, companyNumber, companyName, priority, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ ok: false, error: 'title is required' });
    }

    const [task] = await db
      .insert(workflowTasks)
      .values({
        workflowId: req.params.id,
        title,
        description: description || null,
        assignedTo: assignedTo || null,
        companyNumber: companyNumber || null,
        companyName: companyName || null,
        priority: priority || 'medium',
        dueDate: dueDate || null,
      })
      .returning();

    res.status(201).json({ ok: true, task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ ok: false, error: 'Failed to create task' });
  }
});

/**
 * PATCH /api/workflows/tasks/:taskId
 * Update a task
 */
app.patch('/api/workflows/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const updates = req.body;
    if (updates.status === 'completed') {
      updates.completedAt = new Date();
    }

    const [task] = await db
      .update(workflowTasks)
      .set(updates)
      .where(eq(workflowTasks.id, req.params.taskId))
      .returning();

    if (!task) return res.status(404).json({ ok: false, error: 'Task not found' });

    res.json({ ok: true, task });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ ok: false, error: 'Failed to update task' });
  }
});

/**
 * GET /api/workflows/stats
 * Workflow overview stats
 */
app.get('/api/workflows/stats', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const wfs = await db
      .select()
      .from(workflows)
      .where(eq(workflows.userId, auth.userId));

    const allTasks = await db
      .select()
      .from(workflowTasks)
      .innerJoin(workflows, eq(workflowTasks.workflowId, workflows.id))
      .where(eq(workflows.userId, auth.userId));

    const members = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, auth.userId));

    const totalWorkflows = wfs.length;
    const activeWorkflows = wfs.filter(w => w.status === 'active').length;
    const completedWorkflows = wfs.filter(w => w.status === 'completed').length;
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.workflow_tasks.status === 'completed').length;
    const inProgressTasks = allTasks.filter(t => t.workflow_tasks.status === 'in_progress').length;
    const blockedTasks = allTasks.filter(t => t.workflow_tasks.status === 'blocked').length;

    res.json({
      ok: true,
      stats: {
        totalWorkflows,
        activeWorkflows,
        completedWorkflows,
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        teamSize: members.length,
      },
    });
  } catch (error) {
    console.error('Error fetching workflow stats:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch workflow stats' });
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
// M365 COMPLIANCE API — Teams Tab & Webhook Integration
// ============================================================================

/**
 * GET /api/compliance/risk-summary
 * Returns risk counts for the FineGuard Teams tab.
 * Maps DB complianceStatus + riskLevel → Critical / High / Medium / Low buckets.
 */
app.get('/api/compliance/risk-summary', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const companies = await db
      .select({
        complianceStatus: monitoredCompanies.complianceStatus,
        riskLevel: monitoredCompanies.riskLevel,
      })
      .from(monitoredCompanies)
      .where(eq(monitoredCompanies.userId, auth.userId));

    let critical = 0, high = 0, medium = 0, low = 0;

    for (const c of companies) {
      if (c.complianceStatus === 'overdue') {
        critical++;
      } else if (c.riskLevel === 'high') {
        high++;
      } else if (c.riskLevel === 'medium') {
        medium++;
      } else {
        low++;
      }
    }

    res.json({
      ok: true,
      critical,
      high,
      medium,
      low,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching compliance risk summary:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch risk summary' });
  }
});

/**
 * GET /api/compliance/filings?status=upcoming|all
 * Returns filing deadlines for the FineGuard Teams tab.
 * Combines acspFilings + monitoredCompanies due-date fields.
 */
app.get('/api/compliance/filings', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const statusFilter = (req.query['status'] as string) ?? 'upcoming';
    const now = new Date();
    const cutoffDays = 90;
    const cutoff = new Date(now.getTime() + cutoffDays * 24 * 60 * 60 * 1000);

    // Helper: days until a date string (YYYY-MM-DD or ISO)
    function daysUntil(dateStr: string | null | undefined): number | null {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    }

    function dueDateRiskLevel(days: number): 'Critical' | 'High' | 'Medium' | 'Low' {
      if (days <= 7) return 'Critical';
      if (days <= 30) return 'High';
      if (days <= 60) return 'Medium';
      return 'Low';
    }

    type FilingEntry = {
      id: string;
      name: string;
      dueDate: string;
      riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
      status: 'pending' | 'overdue' | 'filed';
    };

    const filings: FilingEntry[] = [];

    // Source 1: ACSP filings with a dueDate
    const acspRows = await db
      .select()
      .from(acspFilings)
      .where(eq(acspFilings.userId, auth.userId));

    for (const f of acspRows) {
      const days = daysUntil(f.dueDate);
      if (days === null) continue;
      if (statusFilter === 'upcoming' && new Date(f.dueDate!) > cutoff) continue;

      const filingStatus: FilingEntry['status'] =
        f.status === 'submitted' || f.status === 'accepted' ? 'filed'
        : days < 0 ? 'overdue'
        : 'pending';

      filings.push({
        id: f.id,
        name: f.filingType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        dueDate: f.dueDate!,
        riskLevel: days < 0 ? 'Critical' : dueDateRiskLevel(days),
        status: filingStatus,
      });
    }

    // Source 2: monitoredCompanies accounts + confirmation due dates
    const monitored = await db
      .select({
        id: monitoredCompanies.id,
        companyName: monitoredCompanies.companyName,
        accountsNextDue: monitoredCompanies.accountsNextDue,
        confirmationNextDue: monitoredCompanies.confirmationNextDue,
        complianceStatus: monitoredCompanies.complianceStatus,
      })
      .from(monitoredCompanies)
      .where(eq(monitoredCompanies.userId, auth.userId));

    for (const co of monitored) {
      const dueDates: { name: string; due: string | null | undefined }[] = [
        { name: `Annual Accounts — ${co.companyName}`, due: co.accountsNextDue },
        { name: `Confirmation Statement — ${co.companyName}`, due: co.confirmationNextDue },
      ];

      for (const entry of dueDates) {
        const days = daysUntil(entry.due);
        if (days === null) continue;
        if (statusFilter === 'upcoming' && new Date(entry.due!) > cutoff) continue;

        const filingStatus: FilingEntry['status'] =
          co.complianceStatus === 'overdue' ? 'overdue'
          : days < 0 ? 'overdue'
          : 'pending';

        filings.push({
          id: `${co.id}-${entry.name}`,
          name: entry.name,
          dueDate: entry.due!,
          riskLevel: days < 0 ? 'Critical' : dueDateRiskLevel(days),
          status: filingStatus,
        });
      }
    }

    // Sort ascending by dueDate
    filings.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    res.json({ ok: true, filings });
  } catch (error) {
    console.error('Error fetching compliance filings:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch filings' });
  }
});

/**
 * POST /api/webhooks/fineguard/send
 * Server-side trigger: forwards a compliance event to the Azure Function
 * (which retries up to 3 times before calling Power Automate).
 *
 * Requires: authenticated session + valid payload (eventType + firmId).
 * Env vars: AZURE_FUNCTION_URL, FINEGUARD_WEBHOOK_SECRET
 */
app.post('/api/webhooks/fineguard/send', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const body = req.body as Record<string, unknown>;

    if (typeof body['eventType'] !== 'string' || !body['eventType'] ||
        typeof body['firmId'] !== 'string' || !body['firmId']) {
      return res.status(422).json({
        ok: false,
        error: 'Payload must include eventType (string) and firmId (string)',
      });
    }

    const azureFunctionUrl = process.env['AZURE_FUNCTION_URL'] ??
                             process.env['POWER_AUTOMATE_TRIGGER_URL'];

    if (!azureFunctionUrl) {
      return res.status(503).json({
        ok: false,
        error: 'Webhook forwarding not configured (missing AZURE_FUNCTION_URL)',
      });
    }

    const webhookSecret = process.env['FINEGUARD_WEBHOOK_SECRET'] ?? '';

    const payload = {
      ...body,
      timestamp: body['timestamp'] ?? new Date().toISOString(),
    };

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 15_000);

    let forwardRes: Response;
    try {
      forwardRes = await fetch(azureFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fineguard-secret': webhookSecret,
          'x-fineguard-event': String(body['eventType']),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(tid);
    }

    const forwardBody = await forwardRes.json().catch(() => ({}));

    res.status(forwardRes.ok ? 200 : forwardRes.status).json({
      ok: forwardRes.ok,
      forwarded: true,
      upstreamStatus: forwardRes.status,
      upstreamResponse: forwardBody,
    });
  } catch (error) {
    console.error('Error forwarding webhook to Azure Function:', error);
    res.status(502).json({ ok: false, error: 'Failed to forward webhook event' });
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
