/**
 * MCP Connector Routes
 * POST /api/mcp/accounts            — create connector and return OAuth URL
 * GET  /api/mcp/accounts            — list connectors for tenant
 * POST /api/mcp/accounts/:id/refresh — force token refresh
 * GET  /api/mcp/status/:tenantId    — connector and submission status
 * POST /api/mcp/submit-mtd          — orchestrate full MTD submission
 * GET  /api/mcp/hmrc/obligations    — fetch open VAT obligations from HMRC
 * GET  /api/mcp/hmrc/auth-url       — get HMRC OAuth URL
 * POST /api/mcp/hmrc/callback       — HMRC OAuth callback
 * POST /api/mcp/xero/callback       — Xero OAuth callback
 * POST /api/mcp/dynamics/callback   — Dynamics callback
 */
import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import {
  mcpConnectors,
  mtdSubmissions,
  imports,
  invoiceRecords,
  auditEvents,
} from '../db/schema-mtd.js';
import { eq, and, desc, count } from 'drizzle-orm';
import { buildAuthorizationUrl } from '../services/xeroConnector.js';
import { exchangeAuthCode, refreshXeroToken } from '../services/xeroConnector.js';
import { refreshQbToken, buildQbAuthUrl, exchangeQbAuthCode } from '../services/quickbooksConnector.js';
import { refreshSageToken, buildSageAuthUrl } from '../services/sageConnector.js';
import { buildHmrcAuthUrl, exchangeHmrcAuthCode, getVatObligations, submitVatReturn } from '../services/hmrcMtd.js';
import { validateVatReturn, aggregateRecordsToVatReturn } from '../services/ruleEngine.js';
import { auditWriter } from '../services/auditWriter.js';
import { encryptToken } from '../services/secretsManager.js';
import crypto from 'crypto';

const router = Router();

// ─── Middleware ───────────────────────────────────────────────────────────────

function getTenantId(req: Request): string {
  return (req.headers['x-tenant-id'] as string) ?? req.query['tenantId'] as string ?? 'demo-tenant';
}

// ─── POST /api/mcp/accounts ───────────────────────────────────────────────────

router.post('/accounts', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { provider } = req.body as { provider: string };

    if (!['xero', 'quickbooks', 'sage', 'dynamics365'].includes(provider)) {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    const state = crypto.randomBytes(16).toString('hex');
    let authUrl: string;
    let codeVerifier: string | undefined;

    switch (provider) {
      case 'xero': {
        const result = buildAuthorizationUrl(state, true);
        authUrl = result.url;
        codeVerifier = result.codeVerifier;
        break;
      }
      case 'quickbooks':
        authUrl = buildQbAuthUrl(state);
        break;
      case 'sage':
        authUrl = buildSageAuthUrl(state);
        break;
      case 'dynamics365':
        return res.status(200).json({
          message: 'Dynamics 365 uses Azure AD app registration. See /docs/dynamics365-setup.md',
          appRegistrationConfig: (await import('../services/dynamics365.js')).DYNAMICS_APP_REGISTRATION_CONFIG,
        });
      default:
        authUrl = '';
    }

    // Create a pending connector record
    const [connector] = await db
      .insert(mcpConnectors)
      .values({
        tenantId,
        provider,
        status: 'pending',
        metadata: { state, codeVerifier: codeVerifier ?? null },
      })
      .returning();

    await auditWriter.write(tenantId, 'connector.oauth_initiated', 'connector', connector.id, {
      provider,
      state,
    });

    return res.status(201).json({
      connectorId: connector.id,
      provider,
      authUrl,
      state,
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /api/mcp/accounts ────────────────────────────────────────────────────

router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);

    const connectors = await db
      .select({
        id: mcpConnectors.id,
        provider: mcpConnectors.provider,
        displayName: mcpConnectors.displayName,
        status: mcpConnectors.status,
        externalTenantId: mcpConnectors.externalTenantId,
        tokenExpiresAt: mcpConnectors.tokenExpiresAt,
        lastSyncAt: mcpConnectors.lastSyncAt,
        createdAt: mcpConnectors.createdAt,
      })
      .from(mcpConnectors)
      .where(eq(mcpConnectors.tenantId, tenantId))
      .orderBy(desc(mcpConnectors.createdAt));

    return res.json({ connectors });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /api/mcp/accounts/:id/refresh ──────────────────────────────────────

router.post('/accounts/:id/refresh', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    const [connector] = await db
      .select()
      .from(mcpConnectors)
      .where(and(eq(mcpConnectors.id, id), eq(mcpConnectors.tenantId, tenantId)));

    if (!connector) return res.status(404).json({ error: 'Connector not found' });

    switch (connector.provider) {
      case 'xero':
        await refreshXeroToken(id);
        break;
      case 'quickbooks':
        await refreshQbToken(id);
        break;
      case 'sage':
        await refreshSageToken(id);
        break;
      default:
        return res.status(400).json({ error: `Manual refresh not supported for ${connector.provider}` });
    }

    return res.json({ connectorId: id, status: 'refreshed' });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /api/mcp/status/:tenantId ───────────────────────────────────────────

router.get('/status/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    const [connectors, submissions, importStats] = await Promise.all([
      db
        .select({
          provider: mcpConnectors.provider,
          status: mcpConnectors.status,
          lastSyncAt: mcpConnectors.lastSyncAt,
          tokenExpiresAt: mcpConnectors.tokenExpiresAt,
        })
        .from(mcpConnectors)
        .where(eq(mcpConnectors.tenantId, tenantId)),

      db
        .select()
        .from(mtdSubmissions)
        .where(eq(mtdSubmissions.tenantId, tenantId))
        .orderBy(desc(mtdSubmissions.createdAt))
        .limit(5),

      db
        .select({ status: imports.status })
        .from(imports)
        .where(eq(imports.tenantId, tenantId))
        .orderBy(desc(imports.createdAt))
        .limit(20),
    ]);

    return res.json({
      tenantId,
      connectors: connectors.map((c) => ({
        ...c,
        tokenExpiresIn: c.tokenExpiresAt
          ? Math.max(0, Math.floor((c.tokenExpiresAt.getTime() - Date.now()) / 1000))
          : null,
      })),
      recentSubmissions: submissions.map((s) => ({
        id: s.id,
        periodKey: s.periodKey,
        status: s.status,
        submittedAt: s.submittedAt,
        hmrcReceiptId: s.hmrcReceiptId,
      })),
      importSummary: {
        total: importStats.length,
        pending: importStats.filter((i) => i.status === 'pending').length,
        approved: importStats.filter((i) => i.status === 'approved').length,
        submitted: importStats.filter((i) => i.status === 'submitted').length,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /api/mcp/submit-mtd ────────────────────────────────────────────────

router.post('/submit-mtd', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const {
      idempotencyKey,
      vatNumber,
      periodKey,
      periodStart,
      periodEnd,
      importId,
      payload: manualPayload,
    } = req.body as {
      idempotencyKey: string;
      vatNumber: string;
      periodKey: string;
      periodStart: string;
      periodEnd: string;
      importId?: string;
      payload?: Record<string, unknown>;
    };

    if (!idempotencyKey) {
      return res.status(400).json({ error: 'idempotencyKey is required' });
    }
    if (!vatNumber || !periodKey || !periodStart || !periodEnd) {
      return res.status(400).json({ error: 'vatNumber, periodKey, periodStart, periodEnd are required' });
    }

    // Build payload from import records or from manual payload
    let vatPayload: Parameters<typeof submitVatReturn>[0]['payload'];

    if (importId) {
      // Aggregate from approved import records
      const [imp] = await db
        .select()
        .from(imports)
        .where(and(eq(imports.id, importId), eq(imports.tenantId, tenantId)));

      if (!imp) return res.status(404).json({ error: 'Import not found' });
      if (imp.status !== 'approved') {
        return res.status(400).json({ error: `Import must be approved before submission. Current status: ${imp.status}` });
      }

      const records = await db
        .select()
        .from(invoiceRecords)
        .where(eq(invoiceRecords.importId, importId));

      const aggregated = aggregateRecordsToVatReturn(
        records.map((r) => ({
          invoiceId: r.invoiceId ?? '',
          date: r.date,
          netAmount: parseFloat(String(r.netAmount)),
          vatAmount: parseFloat(String(r.vatAmount)),
          vatCode: r.vatCode ?? 'OUTPUT',
          currency: r.currency,
        })),
        periodStart,
        periodEnd
      );

      vatPayload = { ...aggregated, finalised: true };
    } else if (manualPayload) {
      vatPayload = manualPayload as typeof vatPayload;
    } else {
      return res.status(400).json({ error: 'Provide either importId or payload' });
    }

    // Validate before submission
    const validation = validateVatReturn(vatPayload);
    if (!validation.valid) {
      return res.status(422).json({
        error: 'Validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    const result = await submitVatReturn({
      tenantId,
      idempotencyKey,
      vatNumber,
      periodKey,
      periodStart,
      periodEnd,
      payload: vatPayload,
    });

    // Mark import as submitted
    if (importId && result.status === 'accepted') {
      await db
        .update(imports)
        .set({ status: 'submitted', updatedAt: new Date() })
        .where(eq(imports.id, importId));
    }

    const httpStatus = result.status === 'accepted' ? 201 : 422;
    return res.status(httpStatus).json(result);
  } catch (err) {
    console.error('[MCP/submit-mtd]', err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── HMRC OAuth Flow ──────────────────────────────────────────────────────────

router.get('/hmrc/auth-url', (req: Request, res: Response) => {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    const url = buildHmrcAuthUrl(state);
    return res.json({ authUrl: url, state });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/hmrc/callback', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { code } = req.body as { code: string };
    await exchangeHmrcAuthCode(tenantId, code);
    return res.json({ status: 'connected', tenantId });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── HMRC Obligations ─────────────────────────────────────────────────────────

router.get('/hmrc/obligations', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { vatNumber, from, to } = req.query as {
      vatNumber: string;
      from: string;
      to: string;
    };

    if (!vatNumber || !from || !to) {
      return res.status(400).json({ error: 'vatNumber, from, and to are required query params' });
    }

    const obligations = await getVatObligations(tenantId, vatNumber, from, to);
    return res.json({ obligations });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── Xero OAuth Callback ──────────────────────────────────────────────────────

router.post('/xero/callback', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { code, state, connectorId } = req.body as {
      code: string;
      state: string;
      connectorId: string;
    };

    // Retrieve the pending connector to get stored codeVerifier
    const [connector] = await db
      .select()
      .from(mcpConnectors)
      .where(and(eq(mcpConnectors.id, connectorId), eq(mcpConnectors.tenantId, tenantId)));

    if (!connector) return res.status(404).json({ error: 'Connector not found' });

    const meta = connector.metadata as { state?: string; codeVerifier?: string } | null;
    if (meta?.state && meta.state !== state) {
      return res.status(400).json({ error: 'State mismatch — possible CSRF' });
    }

    const tokens = await exchangeAuthCode(code, meta?.codeVerifier);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    await db
      .update(mcpConnectors)
      .set({
        encryptedAccessToken: await encryptToken(tokens.access_token),
        encryptedRefreshToken: tokens.refresh_token ? await encryptToken(tokens.refresh_token) : undefined,
        tokenExpiresAt: expiresAt,
        scopes: tokens.scope,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(mcpConnectors.id, connectorId));

    await auditWriter.write(tenantId, 'connector.xero_connected', 'connector', connectorId, {
      expiresAt: expiresAt.toISOString(),
    });

    return res.json({ connectorId, status: 'active' });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── Audit Events ─────────────────────────────────────────────────────────────

router.get('/audit', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const limit = Math.min(parseInt(req.query.limit as string ?? '100', 10), 500);

    const events = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.tenantId, tenantId))
      .orderBy(desc(auditEvents.createdAt))
      .limit(limit);

    return res.json({ events });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── Mapping Templates ────────────────────────────────────────────────────────

router.get('/mapping-templates', async (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const { mappingTemplates } = await import('../db/schema-mtd.js');
    const templates = await db
      .select()
      .from(mappingTemplates)
      .where(eq(mappingTemplates.tenantId, tenantId));

    return res.json({ templates });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
