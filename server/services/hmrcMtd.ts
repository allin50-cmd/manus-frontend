/**
 * HMRC MTD VAT Submission Service
 * Handles OAuth2 token management and VAT return submission against the HMRC MTD API.
 * Supports sandbox and production environments with full idempotency.
 */
import { db } from '../db/index.js';
import { mtdSubmissions, hmrcTokens } from '../db/schema-mtd.js';
import { eq } from 'drizzle-orm';
import { auditWriter } from './auditWriter.js';
import { encryptToken, decryptToken } from './secretsManager.js';
import { validateVatReturn, type VatReturnPayload } from './ruleEngine.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const HMRC_SANDBOX_BASE = 'https://test-api.service.hmrc.gov.uk';
const HMRC_PROD_BASE = 'https://api.service.hmrc.gov.uk';
const HMRC_TOKEN_URL = 'https://test-api.service.hmrc.gov.uk/oauth/token'; // Sandbox
const HMRC_PROD_TOKEN_URL = 'https://api.service.hmrc.gov.uk/oauth/token';

const MAX_RETRIES = 3;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HmrcVatReturnRequest {
  tenantId: string;
  idempotencyKey: string;
  vatNumber: string;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  payload: VatReturnPayload;
}

export interface HmrcSubmissionReceipt {
  formBundleNumber: string;
  processingDate: string;
  correlationId: string;
  paymentIndicator?: string;
  chargeRefNumber?: string;
}

export interface SubmissionResult {
  submissionId: string;
  status: 'accepted' | 'rejected' | 'error';
  receipt?: HmrcSubmissionReceipt;
  validationErrors?: ReturnType<typeof validateVatReturn>['errors'];
  hmrcErrors?: unknown[];
  requestBlobUrl?: string;
  responseBlobUrl?: string;
}

// ─── Environment ──────────────────────────────────────────────────────────────

function getApiBase(): string {
  return process.env.HMRC_ENVIRONMENT === 'production' ? HMRC_PROD_BASE : HMRC_SANDBOX_BASE;
}

function getTokenUrl(): string {
  return process.env.HMRC_ENVIRONMENT === 'production' ? HMRC_PROD_TOKEN_URL : HMRC_TOKEN_URL;
}

// ─── OAuth2 Token Management ──────────────────────────────────────────────────

/**
 * Build HMRC OAuth2 authorization URL.
 * User must visit this URL and grant consent.
 */
export function buildHmrcAuthUrl(state: string): string {
  const clientId = process.env.HMRC_CLIENT_ID;
  const redirectUri = process.env.HMRC_REDIRECT_URI;
  const base = process.env.HMRC_ENVIRONMENT === 'production'
    ? 'https://api.service.hmrc.gov.uk'
    : 'https://test-api.service.hmrc.gov.uk';

  if (!clientId || !redirectUri) {
    throw new Error('HMRC_CLIENT_ID and HMRC_REDIRECT_URI must be set');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'write:vat read:vat',
    redirect_uri: redirectUri,
    state,
  });

  return `${base}/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange HMRC authorization code for tokens and persist (encrypted) to DB.
 */
export async function exchangeHmrcAuthCode(tenantId: string, code: string): Promise<void> {
  const clientId = process.env.HMRC_CLIENT_ID!;
  const clientSecret = process.env.HMRC_CLIENT_SECRET!;
  const redirectUri = process.env.HMRC_REDIRECT_URI!;

  const res = await fetch(getTokenUrl(), {
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
    throw new Error(`HMRC auth code exchange failed: ${res.status} ${err}`);
  }

  const tokens = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
  };

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // Upsert token record
  await db
    .insert(hmrcTokens)
    .values({
      tenantId,
      encryptedAccessToken: await encryptToken(tokens.access_token),
      encryptedRefreshToken: tokens.refresh_token ? await encryptToken(tokens.refresh_token) : '',
      expiresAt,
      scopes: tokens.scope,
    })
    .onConflictDoUpdate({
      target: hmrcTokens.tenantId,
      set: {
        encryptedAccessToken: await encryptToken(tokens.access_token),
        encryptedRefreshToken: tokens.refresh_token ? await encryptToken(tokens.refresh_token) : '',
        expiresAt,
        updatedAt: new Date(),
      },
    });

  await auditWriter.write(tenantId, 'hmrc.token_obtained', 'tenant', tenantId, {
    expiresAt: expiresAt.toISOString(),
  });
}

/**
 * Retrieve a valid HMRC access token, refreshing if expired.
 */
async function getHmrcAccessToken(tenantId: string): Promise<string> {
  const [record] = await db
    .select()
    .from(hmrcTokens)
    .where(eq(hmrcTokens.tenantId, tenantId));

  if (!record) {
    throw new Error(`No HMRC token found for tenant ${tenantId} — run OAuth flow first`);
  }

  // Refresh if within 2 minutes of expiry
  if (record.expiresAt.getTime() - Date.now() < 120_000) {
    if (!record.encryptedRefreshToken) {
      throw new Error('HMRC token expired and no refresh token available — re-authenticate');
    }
    const refreshToken = await decryptToken(record.encryptedRefreshToken);
    await refreshHmrcToken(tenantId, refreshToken);

    const [refreshed] = await db
      .select()
      .from(hmrcTokens)
      .where(eq(hmrcTokens.tenantId, tenantId));
    return decryptToken(refreshed.encryptedAccessToken);
  }

  return decryptToken(record.encryptedAccessToken);
}

async function refreshHmrcToken(tenantId: string, refreshToken: string): Promise<void> {
  const clientId = process.env.HMRC_CLIENT_ID!;
  const clientSecret = process.env.HMRC_CLIENT_SECRET!;

  const res = await fetch(getTokenUrl(), {
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
    throw new Error(`HMRC token refresh failed: ${res.status} ${err}`);
  }

  const tokens = await res.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await db
    .update(hmrcTokens)
    .set({
      encryptedAccessToken: await encryptToken(tokens.access_token),
      ...(tokens.refresh_token ? { encryptedRefreshToken: await encryptToken(tokens.refresh_token) } : {}),
      expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(hmrcTokens.tenantId, tenantId));

  await auditWriter.write(tenantId, 'hmrc.token_refreshed', 'tenant', tenantId, {
    expiresAt: expiresAt.toISOString(),
  });
}

// ─── VAT Return Retrieval ─────────────────────────────────────────────────────

/**
 * Retrieve open VAT return obligations from HMRC for a given VAT number.
 */
export async function getVatObligations(
  tenantId: string,
  vatNumber: string,
  fromDate: string,
  toDate: string
): Promise<unknown[]> {
  const accessToken = await getHmrcAccessToken(tenantId);
  const base = getApiBase();

  const res = await fetch(
    `${base}/organisations/vat/${vatNumber}/obligations?from=${fromDate}&to=${toDate}&status=O`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.hmrc.1.0+json',
        'Gov-Test-Scenario': process.env.HMRC_ENVIRONMENT !== 'production' ? 'QUARTERLY_PERIODS_START_ON_1_JAN' : '',
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HMRC obligations fetch failed: ${res.status} ${err}`);
  }

  const data = await res.json() as { obligations: unknown[] };
  return data.obligations ?? [];
}

// ─── VAT Return Submission ────────────────────────────────────────────────────

/**
 * Submit a VAT return to HMRC MTD API.
 * Implements idempotency — returns existing receipt if already submitted with same key.
 */
export async function submitVatReturn(request: HmrcVatReturnRequest): Promise<SubmissionResult> {
  const { tenantId, idempotencyKey, vatNumber, periodKey, periodStart, periodEnd, payload } = request;

  // ── 1. Idempotency check ────────────────────────────────────────────────────
  const [existing] = await db
    .select()
    .from(mtdSubmissions)
    .where(eq(mtdSubmissions.idempotencyKey, idempotencyKey));

  if (existing && existing.status === 'accepted') {
    return {
      submissionId: existing.id,
      status: 'accepted',
      receipt: {
        formBundleNumber: existing.hmrcFormBundleNumber ?? '',
        processingDate: existing.hmrcProcessingDate ?? '',
        correlationId: existing.hmrcCorrelationId ?? '',
      },
    };
  }

  // ── 2. Validate ─────────────────────────────────────────────────────────────
  const validation = validateVatReturn(payload);
  if (!validation.valid) {
    await auditWriter.write(tenantId, 'submission.validation_failed', 'submission', null, {
      idempotencyKey,
      errors: validation.errors,
    });
    return {
      submissionId: '',
      status: 'rejected',
      validationErrors: validation.errors,
    };
  }

  // ── 3. Create / update DB submission record ──────────────────────────────────
  const submissionValues = {
    tenantId,
    idempotencyKey,
    vatNumber,
    periodKey,
    periodStart,
    periodEnd,
    vatDueSales: String(payload.vatDueSales),
    vatDueAcquisitions: String(payload.vatDueAcquisitions),
    totalVatDue: String(payload.totalVatDue),
    vatReclaimedCurrPeriod: String(payload.vatReclaimedCurrPeriod),
    netVatDue: String(payload.netVatDue),
    totalValueSalesExVAT: String(payload.totalValueSalesExVAT),
    totalValuePurchasesExVAT: String(payload.totalValuePurchasesExVAT),
    totalValueGoodsSuppliedExVAT: String(payload.totalValueGoodsSuppliedExVAT),
    totalAcquisitionsExVAT: String(payload.totalAcquisitionsExVAT),
    finalised: payload.finalised,
    status: 'pending' as const,
  };

  let submissionId: string;
  if (existing) {
    await db
      .update(mtdSubmissions)
      .set({ ...submissionValues, updatedAt: new Date() })
      .where(eq(mtdSubmissions.id, existing.id));
    submissionId = existing.id;
  } else {
    const [inserted] = await db.insert(mtdSubmissions).values(submissionValues).returning({ id: mtdSubmissions.id });
    submissionId = inserted.id;
  }

  // ── 4. Get HMRC access token ──────────────────────────────────────────────
  let accessToken: string;
  try {
    accessToken = await getHmrcAccessToken(tenantId);
  } catch (err) {
    await db
      .update(mtdSubmissions)
      .set({ status: 'error', updatedAt: new Date() })
      .where(eq(mtdSubmissions.id, submissionId));
    throw err;
  }

  // ── 5. Build HMRC request ─────────────────────────────────────────────────
  const hmrcPayload = {
    periodKey,
    vatDueSales: payload.vatDueSales,
    vatDueAcquisitions: payload.vatDueAcquisitions,
    totalVatDue: payload.totalVatDue,
    vatReclaimedCurrPeriod: payload.vatReclaimedCurrPeriod,
    netVatDue: payload.netVatDue,
    totalValueSalesExVAT: payload.totalValueSalesExVAT,
    totalValuePurchasesExVAT: payload.totalValuePurchasesExVAT,
    totalValueGoodsSuppliedExVAT: payload.totalValueGoodsSuppliedExVAT,
    totalAcquisitionsExVAT: payload.totalAcquisitionsExVAT,
    finalised: payload.finalised,
  };

  // ── 6. Submit to HMRC ─────────────────────────────────────────────────────
  const base = getApiBase();
  const correlationId = crypto.randomUUID();
  let hmrcResponse: Response;
  let hmrcResponseBody: unknown;

  await auditWriter.write(tenantId, 'submission.attempted', 'submission', submissionId, {
    idempotencyKey,
    vatNumber,
    periodKey,
    correlationId,
  }, hmrcPayload as unknown as Record<string, unknown>);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    hmrcResponse = await fetch(`${base}/organisations/vat/${vatNumber}/returns`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.hmrc.1.0+json',
        'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
        'Gov-Client-Public-IP': '198.51.100.0', // Replace with real client IP in production
        'Gov-Client-Public-Port': '443',
        'Gov-Client-Device-ID': submissionId,
        'Gov-Client-User-IDs': `fineguard=${tenantId}`,
        'Gov-Client-Timezone': 'UTC+00:00',
        'Gov-Client-User-Agent': `FineGuard/1.0`,
        'Gov-Vendor-Version': 'FineGuard=1.0.0',
        'X-Correlation-Id': correlationId,
        // Sandbox test scenario
        ...(process.env.HMRC_ENVIRONMENT !== 'production' ? { 'Gov-Test-Scenario': 'QUARTERLY_PERIODS_START_ON_1_JAN' } : {}),
      },
      body: JSON.stringify(hmrcPayload),
    });

    if (hmrcResponse.status !== 429) break;
    // Rate limited — exponential backoff
    await sleep(Math.pow(2, attempt) * 1000);
  }

  hmrcResponseBody = await hmrcResponse!.text();
  let parsedResponse: Record<string, unknown> = {};
  try {
    parsedResponse = JSON.parse(hmrcResponseBody as string);
  } catch {
    parsedResponse = { raw: hmrcResponseBody };
  }

  // ── 7. Handle response ───────────────────────────────────────────────────
  const success = hmrcResponse!.status === 201;
  const receipt = success ? (parsedResponse as HmrcSubmissionReceipt) : undefined;

  await auditWriter.write(
    tenantId,
    success ? 'submission.accepted' : 'submission.rejected',
    'submission',
    submissionId,
    {
      idempotencyKey,
      hmrcStatus: hmrcResponse!.status,
      formBundleNumber: receipt?.formBundleNumber,
      processingDate: receipt?.processingDate,
      correlationId,
    },
    parsedResponse
  );

  await db
    .update(mtdSubmissions)
    .set({
      status: success ? 'accepted' : 'rejected',
      hmrcReceiptId: receipt?.formBundleNumber ?? '',
      hmrcCorrelationId: correlationId,
      hmrcProcessingDate: receipt?.processingDate ?? '',
      hmrcFormBundleNumber: receipt?.formBundleNumber ?? '',
      submittedAt: success ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(mtdSubmissions.id, submissionId));

  if (!success) {
    return {
      submissionId,
      status: 'rejected',
      hmrcErrors: [parsedResponse],
    };
  }

  return {
    submissionId,
    status: 'accepted',
    receipt: receipt as HmrcSubmissionReceipt,
  };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

// Ensure crypto is available (Node 18+ has it globally)
declare const crypto: { randomUUID(): string };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
