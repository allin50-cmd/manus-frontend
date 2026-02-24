/**
 * Sage Business Cloud Connector Scaffold
 * OAuth2 flow and sample API calls.
 * Full implementation follows the same pattern as xeroConnector.ts.
 */
import { auditWriter } from './auditWriter.js';
import { encryptToken, decryptToken } from './secretsManager.js';
import { db } from '../db/index.js';
import { mcpConnectors } from '../db/schema-mtd.js';
import { eq } from 'drizzle-orm';

const SAGE_AUTH_BASE = 'https://www.sageone.com/oauth2/auth/central';
const SAGE_TOKEN_URL = 'https://oauth.accounting.sage.com/token';
const SAGE_API_BASE = 'https://api.accounting.sage.com/v3.1';

// ─── Auth URL ─────────────────────────────────────────────────────────────────

export function buildSageAuthUrl(state: string): string {
  const clientId = process.env.SAGE_CLIENT_ID;
  const redirectUri = process.env.SAGE_REDIRECT_URI;
  if (!clientId || !redirectUri) throw new Error('SAGE_CLIENT_ID and SAGE_REDIRECT_URI must be set');

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'full_access',
    state,
  });
  return `${SAGE_AUTH_BASE}?${params.toString()}`;
}

// ─── Token Exchange ───────────────────────────────────────────────────────────

export async function exchangeSageAuthCode(code: string, tenantId: string): Promise<void> {
  const clientId = process.env.SAGE_CLIENT_ID!;
  const clientSecret = process.env.SAGE_CLIENT_SECRET!;
  const redirectUri = process.env.SAGE_REDIRECT_URI!;

  const res = await fetch(SAGE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sage token exchange failed: ${res.status} ${err}`);
  }

  const tokens = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await db.insert(mcpConnectors).values({
    tenantId,
    provider: 'sage',
    displayName: 'Sage Business Cloud',
    status: 'active',
    encryptedAccessToken: await encryptToken(tokens.access_token),
    encryptedRefreshToken: await encryptToken(tokens.refresh_token),
    tokenExpiresAt: expiresAt,
    scopes: 'full_access',
  });

  await auditWriter.write(tenantId, 'connector.sage_connected', 'connector', null, {
    expiresAt: expiresAt.toISOString(),
  });
}

// ─── Fetch Invoices (Scaffold) ────────────────────────────────────────────────

export async function fetchSageInvoices(
  connectorId: string,
  tenantId: string
): Promise<Array<Record<string, unknown>>> {
  // TODO: implement full Sage API calls with pagination
  await auditWriter.write(tenantId, 'connector.sage_invoices_fetched', 'connector', connectorId, {
    count: 0,
    note: 'Sage connector scaffold — implement full API calls',
  });
  return [];
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export async function refreshSageToken(connectorId: string): Promise<void> {
  const [connector] = await db
    .select()
    .from(mcpConnectors)
    .where(eq(mcpConnectors.id, connectorId));

  if (!connector?.encryptedRefreshToken) {
    throw new Error(`No Sage refresh token for connector ${connectorId}`);
  }

  const refreshToken = await decryptToken(connector.encryptedRefreshToken);
  const clientId = process.env.SAGE_CLIENT_ID!;
  const clientSecret = process.env.SAGE_CLIENT_SECRET!;

  const res = await fetch(SAGE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    await db.update(mcpConnectors).set({ status: 'error' }).where(eq(mcpConnectors.id, connectorId));
    throw new Error(`Sage token refresh failed: ${res.status} ${err}`);
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

  await auditWriter.write(connector.tenantId, 'connector.sage_token_refreshed', 'connector', connectorId, {
    expiresAt: expiresAt.toISOString(),
  });
}
