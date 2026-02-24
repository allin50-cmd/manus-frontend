/**
 * QuickBooks Online Connector Scaffold
 * OAuth2 Authorization Code flow + sample API calls.
 * Full implementation follows the same pattern as xeroConnector.ts.
 */
import { auditWriter } from './auditWriter.js';
import { encryptToken, decryptToken } from './secretsManager.js';
import { db } from '../db/index.js';
import { mcpConnectors } from '../db/schema-mtd.js';
import { eq } from 'drizzle-orm';

const QB_AUTH_BASE = 'https://appcenter.intuit.com/connect/oauth2';
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const QB_API_BASE = 'https://quickbooks.api.intuit.com/v3';

const QB_SCOPES = ['com.intuit.quickbooks.accounting'].join(' ');

// ─── Auth URL ─────────────────────────────────────────────────────────────────

export function buildQbAuthUrl(state: string): string {
  const clientId = process.env.QB_CLIENT_ID;
  const redirectUri = process.env.QB_REDIRECT_URI;
  if (!clientId || !redirectUri) throw new Error('QB_CLIENT_ID and QB_REDIRECT_URI must be set');

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: QB_SCOPES,
    redirect_uri: redirectUri,
    state,
  });
  return `${QB_AUTH_BASE}?${params.toString()}`;
}

// ─── Token Exchange ───────────────────────────────────────────────────────────

export async function exchangeQbAuthCode(
  code: string,
  realmId: string,
  tenantId: string
): Promise<void> {
  const clientId = process.env.QB_CLIENT_ID!;
  const clientSecret = process.env.QB_CLIENT_SECRET!;
  const redirectUri = process.env.QB_REDIRECT_URI!;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`QB token exchange failed: ${res.status} ${err}`);
  }

  const tokens = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    x_refresh_token_expires_in: number;
  };

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // Find or create connector record
  const [existing] = await db
    .select()
    .from(mcpConnectors)
    .where(eq(mcpConnectors.tenantId, tenantId));

  const values = {
    tenantId,
    provider: 'quickbooks' as const,
    externalTenantId: realmId,
    displayName: `QuickBooks (${realmId})`,
    status: 'active' as const,
    encryptedAccessToken: await encryptToken(tokens.access_token),
    encryptedRefreshToken: await encryptToken(tokens.refresh_token),
    tokenExpiresAt: expiresAt,
    scopes: QB_SCOPES,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(mcpConnectors).set(values).where(eq(mcpConnectors.id, existing.id));
  } else {
    await db.insert(mcpConnectors).values(values);
  }

  await auditWriter.write(tenantId, 'connector.quickbooks_connected', 'connector', null, {
    realmId,
    expiresAt: expiresAt.toISOString(),
  });
}

// ─── Sample Invoice Fetch ─────────────────────────────────────────────────────

/**
 * Fetch invoices from QuickBooks (scaffold — returns mock data in development).
 * Full implementation would paginate using startPosition and maxResults.
 */
export async function fetchQbInvoices(
  connectorId: string,
  tenantId: string,
  realmId: string
): Promise<Array<Record<string, unknown>>> {
  // TODO: Implement full QB API calls following xeroConnector pattern
  await auditWriter.write(tenantId, 'connector.qb_invoices_fetched', 'connector', connectorId, {
    realmId,
    count: 0,
    note: 'QB connector scaffold — implement full API calls',
  });

  return [];
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export async function refreshQbToken(connectorId: string): Promise<void> {
  const [connector] = await db
    .select()
    .from(mcpConnectors)
    .where(eq(mcpConnectors.id, connectorId));

  if (!connector?.encryptedRefreshToken) {
    throw new Error(`No QB refresh token for connector ${connectorId}`);
  }

  const refreshToken = await decryptToken(connector.encryptedRefreshToken);
  const clientId = process.env.QB_CLIENT_ID!;
  const clientSecret = process.env.QB_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    await db.update(mcpConnectors).set({ status: 'error' }).where(eq(mcpConnectors.id, connectorId));
    throw new Error(`QB token refresh failed: ${res.status} ${err}`);
  }

  const tokens = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await db.update(mcpConnectors).set({
    encryptedAccessToken: await encryptToken(tokens.access_token),
    encryptedRefreshToken: await encryptToken(tokens.refresh_token),
    tokenExpiresAt: expiresAt,
    status: 'active',
    updatedAt: new Date(),
  }).where(eq(mcpConnectors.id, connectorId));

  await auditWriter.write(connector.tenantId, 'connector.qb_token_refreshed', 'connector', connectorId, {
    expiresAt: expiresAt.toISOString(),
  });
}
