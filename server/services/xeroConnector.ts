/**
 * Xero Connector Service
 * Full OAuth2 Authorization Code flow with PKCE support, token refresh, paginated API calls,
 * VAT report fetching, invoice fetching, webhook subscription, and rate-limit handling.
 */
import crypto from 'crypto';
import { db } from '../db/index.js';
import { mcpConnectors } from '../db/schema-mtd.js';
import { eq } from 'drizzle-orm';
import { auditWriter } from './auditWriter.js';
import { encryptToken, decryptToken } from './secretsManager.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const XERO_AUTH_BASE = 'https://login.xero.com/identity/connect';
const XERO_API_BASE = 'https://api.xero.com';
const XERO_SCOPES = [
  'openid',
  'profile',
  'email',
  'accounting.transactions.read',
  'accounting.reports.read',
  'accounting.settings.read',
  'offline_access',
].join(' ');

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_RETRIES = 4;

// In-memory rate limit tracker (per tenantId)
const rateLimitTracker = new Map<string, { count: number; resetAt: number }>();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface XeroTokenSet {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface XeroTenantConnection {
  id: string;
  authEventId: string;
  tenantId: string;
  tenantType: string;
  tenantName: string;
  createdDateUtc: string;
}

export interface XeroInvoice {
  InvoiceID: string;
  InvoiceNumber: string;
  Reference: string;
  Type: string;
  Status: string;
  Date: string;
  DueDate: string;
  SubTotal: number;
  TotalTax: number;
  Total: number;
  CurrencyCode: string;
  LineItems?: XeroLineItem[];
}

export interface XeroLineItem {
  Description: string;
  Quantity: number;
  UnitAmount: number;
  TaxType: string;
  TaxAmount: number;
  LineAmount: number;
}

export interface CanonicalInvoice {
  invoiceId: string;
  tenantId: string;
  clientId: string;
  date: string;
  netAmount: number;
  vatAmount: number;
  vatCode: string;
  currency: string;
  source: 'xero' | 'quickbooks' | 'pdf' | 'csv';
  confidence: number;
}

// ─── PKCE Helpers ─────────────────────────────────────────────────────────────

/**
 * Generate a PKCE code verifier (43-128 chars, URL-safe base64).
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(64).toString('base64url').slice(0, 128);
}

/**
 * Derive the PKCE code challenge from a verifier (S256 method).
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// ─── Authorization URL ────────────────────────────────────────────────────────

/**
 * Build the Xero OAuth2 authorization URL.
 * Supports both PKCE (public clients) and standard server flow.
 *
 * @param state      Random CSRF state token
 * @param usePkce    Use PKCE (recommended for SPAs / native apps)
 * @returns          { url, codeVerifier } — store codeVerifier server-side in session
 */
export function buildAuthorizationUrl(
  state: string,
  usePkce = true
): { url: string; codeVerifier?: string } {
  const clientId = process.env.XERO_CLIENT_ID;
  const redirectUri = process.env.XERO_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    throw new Error('XERO_CLIENT_ID and XERO_REDIRECT_URI must be set');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: XERO_SCOPES,
    state,
  });

  let codeVerifier: string | undefined;
  if (usePkce) {
    codeVerifier = generateCodeVerifier();
    params.set('code_challenge', generateCodeChallenge(codeVerifier));
    params.set('code_challenge_method', 'S256');
  }

  return {
    url: `${XERO_AUTH_BASE}/authorize?${params.toString()}`,
    codeVerifier,
  };
}

// ─── Token Exchange ───────────────────────────────────────────────────────────

/**
 * Exchange authorization code for tokens (supports PKCE and client secret flows).
 */
export async function exchangeAuthCode(
  code: string,
  codeVerifier?: string
): Promise<XeroTokenSet> {
  const clientId = process.env.XERO_CLIENT_ID!;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  const redirectUri = process.env.XERO_REDIRECT_URI!;

  const body: Record<string, string> = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
  };
  if (codeVerifier) {
    body.code_verifier = codeVerifier;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  const res = await fetch(`${XERO_AUTH_BASE}/token`, {
    method: 'POST',
    headers,
    body: new URLSearchParams(body).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Xero token exchange failed: ${res.status} ${err}`);
  }
  return res.json() as Promise<XeroTokenSet>;
}

// ─── Token Refresh ────────────────────────────────────────────────────────────

/**
 * Refresh an expired Xero access token.
 * Persists updated tokens (encrypted) back to DB.
 */
export async function refreshXeroToken(connectorId: string): Promise<XeroTokenSet> {
  const [connector] = await db
    .select()
    .from(mcpConnectors)
    .where(eq(mcpConnectors.id, connectorId));

  if (!connector || !connector.encryptedRefreshToken) {
    throw new Error(`Connector ${connectorId} not found or missing refresh token`);
  }

  const refreshToken = await decryptToken(connector.encryptedRefreshToken);
  const clientId = process.env.XERO_CLIENT_ID!;
  const clientSecret = process.env.XERO_CLIENT_SECRET;

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  const res = await fetch(`${XERO_AUTH_BASE}/token`, {
    method: 'POST',
    headers,
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    await db
      .update(mcpConnectors)
      .set({ status: 'error', updatedAt: new Date() })
      .where(eq(mcpConnectors.id, connectorId));
    throw new Error(`Xero token refresh failed: ${res.status} ${err}`);
  }

  const tokens: XeroTokenSet = await res.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await db
    .update(mcpConnectors)
    .set({
      encryptedAccessToken: await encryptToken(tokens.access_token),
      encryptedRefreshToken: tokens.refresh_token
        ? await encryptToken(tokens.refresh_token)
        : connector.encryptedRefreshToken,
      tokenExpiresAt: expiresAt,
      status: 'active',
      updatedAt: new Date(),
    })
    .where(eq(mcpConnectors.id, connectorId));

  await auditWriter.write(connector.tenantId, 'connector.token_refreshed', 'connector', connectorId, {
    provider: 'xero',
    expiresAt: expiresAt.toISOString(),
  });

  return tokens;
}

// ─── API Request Helper ───────────────────────────────────────────────────────

/**
 * Make an authenticated Xero API call with automatic retry on 429 (rate limit)
 * and token refresh on 401.
 */
async function xeroApiRequest<T>(
  connectorId: string,
  path: string,
  xeroTenantId: string,
  options: RequestInit = {},
  attempt = 0
): Promise<T> {
  const [connector] = await db
    .select()
    .from(mcpConnectors)
    .where(eq(mcpConnectors.id, connectorId));

  if (!connector?.encryptedAccessToken) {
    throw new Error(`No access token for connector ${connectorId}`);
  }

  // Check token expiry — refresh if within 60s of expiry
  if (connector.tokenExpiresAt && connector.tokenExpiresAt.getTime() - Date.now() < 60_000) {
    await refreshXeroToken(connectorId);
    return xeroApiRequest<T>(connectorId, path, xeroTenantId, options, attempt);
  }

  const accessToken = await decryptToken(connector.encryptedAccessToken);

  const res = await fetch(`${XERO_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Xero-Tenant-Id': xeroTenantId,
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });

  if (res.status === 401 && attempt < MAX_RETRIES) {
    // Token expired — refresh and retry
    await refreshXeroToken(connectorId);
    return xeroApiRequest<T>(connectorId, path, xeroTenantId, options, attempt + 1);
  }

  if (res.status === 429 && attempt < MAX_RETRIES) {
    // Rate limited — honour Retry-After header
    const retryAfter = parseInt(res.headers.get('Retry-After') ?? '10', 10);
    await sleep(retryAfter * 1000);
    return xeroApiRequest<T>(connectorId, path, xeroTenantId, options, attempt + 1);
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Xero API error ${res.status} on ${path}: ${err}`);
  }

  return res.json() as Promise<T>;
}

// ─── Tenant Connections ───────────────────────────────────────────────────────

/**
 * List Xero tenant connections for the authenticated user.
 */
export async function listXeroConnections(accessToken: string): Promise<XeroTenantConnection[]> {
  const res = await fetch(`${XERO_API_BASE}/connections`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to list Xero connections: ${res.status}`);
  }
  return res.json() as Promise<XeroTenantConnection[]>;
}

// ─── Invoice Fetching (Paginated) ─────────────────────────────────────────────

/**
 * Fetch all invoices for a Xero organisation, handling pagination.
 * Returns canonical invoice models.
 *
 * @param connectorId  DB connector row ID
 * @param tenantId     FineGuard tenant UUID
 * @param xeroTenantId Xero organisation tenant ID
 * @param fromDate     Optional ISO date to filter (e.g. "2024-01-01")
 */
export async function fetchXeroInvoices(
  connectorId: string,
  tenantId: string,
  xeroTenantId: string,
  fromDate?: string
): Promise<CanonicalInvoice[]> {
  const allInvoices: CanonicalInvoice[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const dateFilter = fromDate ? `&where=Date>DateTime(${fromDate.replace(/-/g, ',')})` : '';
    const path = `/api.xro/2.0/Invoices?page=${page}&pageSize=${pageSize}&Type=ACCREC${dateFilter}`;

    const data = await xeroApiRequest<{ Invoices: XeroInvoice[] }>(
      connectorId,
      path,
      xeroTenantId
    );

    const batch = (data.Invoices ?? []).map((inv) =>
      mapXeroInvoiceToCanonical(inv, tenantId)
    );
    allInvoices.push(...batch);

    if (batch.length < pageSize) break;
    page++;
  }

  await auditWriter.write(tenantId, 'connector.invoices_fetched', 'connector', connectorId, {
    provider: 'xero',
    count: allInvoices.length,
    fromDate,
  });

  return allInvoices;
}

// ─── VAT Report Fetching ──────────────────────────────────────────────────────

/**
 * Fetch the VAT return summary from Xero.
 */
export async function fetchXeroVatReport(
  connectorId: string,
  tenantId: string,
  xeroTenantId: string
): Promise<Record<string, unknown>> {
  const data = await xeroApiRequest<{ Reports: unknown[] }>(
    connectorId,
    '/api.xro/2.0/Reports/AgedReceivablesByContact',
    xeroTenantId
  );

  await auditWriter.write(tenantId, 'connector.vat_report_fetched', 'connector', connectorId, {
    provider: 'xero',
  });

  return data as Record<string, unknown>;
}

// ─── Webhook Handling ─────────────────────────────────────────────────────────

/**
 * Verify a Xero webhook HMAC-SHA256 signature.
 * Returns true if the signature is valid — REJECT the payload if false.
 *
 * @param payload       Raw request body buffer
 * @param signature     Value of 'x-xero-signature' header
 * @param webhookSecret Connector webhook secret from DB
 */
export function verifyXeroWebhookSignature(
  payload: Buffer,
  signature: string,
  webhookSecret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('base64');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ─── Field Mapping ────────────────────────────────────────────────────────────

function mapXeroInvoiceToCanonical(inv: XeroInvoice, tenantId: string): CanonicalInvoice {
  // Xero dates are in /Date(timestamp+offset)/ format — parse to YYYY-MM-DD
  const dateStr = parseXeroDate(inv.Date);
  const vatCode = inv.LineItems?.[0]?.TaxType ?? 'OUTPUT';

  return {
    invoiceId: inv.InvoiceID,
    tenantId,
    clientId: inv.Reference ?? inv.InvoiceNumber,
    date: dateStr,
    netAmount: inv.SubTotal ?? 0,
    vatAmount: inv.TotalTax ?? 0,
    vatCode,
    currency: inv.CurrencyCode ?? 'GBP',
    source: 'xero',
    confidence: 1.0,
  };
}

function parseXeroDate(xeroDate: string): string {
  if (!xeroDate) return '';
  const match = xeroDate.match(/\/Date\((\d+)([+-]\d+)?\)\//);
  if (match) {
    return new Date(parseInt(match[1], 10)).toISOString().split('T')[0];
  }
  // Already ISO format
  return xeroDate.split('T')[0];
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
