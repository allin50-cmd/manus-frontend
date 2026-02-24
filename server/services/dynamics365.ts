/**
 * Microsoft Dynamics 365 / Dataverse Connector Scaffold
 * Azure AD authentication, webhook subscription, and entity mapping.
 *
 * Auth: Uses Azure AD app registration with client_credentials flow (service-to-service).
 * For user-delegated access, use Authorization Code flow via MSAL.
 */
import { auditWriter } from './auditWriter.js';

const DATAVERSE_API_VERSION = '9.2';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DynamicsCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  dataverseUrl: string; // e.g. https://org.crm11.dynamics.com
}

export interface DataverseInvoice {
  invoiceid: string;
  name: string;
  invoicedate: string;
  totalamount: number;
  totaltax: number;
  customerid_account?: { name: string; accountid: string };
  transactioncurrencyid?: { isocurrencycode: string };
}

// ─── Azure AD Token (Client Credentials) ─────────────────────────────────────

/**
 * Obtain an access token using Azure AD client_credentials flow.
 * Requires an app registration with Dataverse API permissions.
 *
 * App Registration guidance:
 * 1. Register app in Azure AD → API permissions → Dynamics CRM → user_impersonation
 * 2. For service-to-service: grant admin consent and use client credentials flow.
 * 3. Store client_secret in Azure Key Vault (never in code).
 */
export async function getDynamicsAccessToken(creds: DynamicsCredentials): Promise<string> {
  const { tenantId, clientId, clientSecret, dataverseUrl } = creds;
  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const res = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: `${dataverseUrl}/.default`,
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dynamics token fetch failed: ${res.status} ${err}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// ─── Dataverse API Request ────────────────────────────────────────────────────

async function dataverseRequest<T>(
  accessToken: string,
  dataverseUrl: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${dataverseUrl}/api/data/v${DATAVERSE_API_VERSION}/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dataverse API error ${res.status} on ${path}: ${err}`);
  }

  return res.json() as Promise<T>;
}

// ─── Fetch Invoices ───────────────────────────────────────────────────────────

/**
 * Fetch invoices from Dynamics 365 and map to canonical model.
 * Uses OData query to select relevant fields only.
 */
export async function fetchDynamicsInvoices(
  fgTenantId: string,
  creds: DynamicsCredentials
): Promise<Array<Record<string, unknown>>> {
  const accessToken = await getDynamicsAccessToken(creds);

  const select = [
    'invoiceid',
    'name',
    'invoicedate',
    'totalamount',
    'totaltax',
    '_customerid_value',
  ].join(',');

  const data = await dataverseRequest<{ value: DataverseInvoice[] }>(
    accessToken,
    creds.dataverseUrl,
    `invoices?$select=${select}&$top=100&$filter=statecode eq 0`
  );

  const records = (data.value ?? []).map((inv) =>
    mapDynamicsInvoice(inv, fgTenantId)
  );

  await auditWriter.write(fgTenantId, 'connector.dynamics_invoices_fetched', 'connector', null, {
    count: records.length,
    dataverseUrl: creds.dataverseUrl,
  });

  return records;
}

function mapDynamicsInvoice(inv: DataverseInvoice, tenantId: string): Record<string, unknown> {
  return {
    invoiceId: inv.invoiceid,
    tenantId,
    clientId: inv.customerid_account?.name ?? '',
    date: inv.invoicedate?.split('T')[0] ?? '',
    netAmount: (inv.totalamount ?? 0) - (inv.totaltax ?? 0),
    vatAmount: inv.totaltax ?? 0,
    vatCode: 'OUTPUT',
    currency: inv.transactioncurrencyid?.isocurrencycode ?? 'GBP',
    source: 'dynamics365',
    confidence: 0.95,
  };
}

// ─── Webhook Subscription ─────────────────────────────────────────────────────

/**
 * Register a Dataverse webhook endpoint for Invoice entity changes.
 * This will notify FineGuard when invoices are created/updated in Dynamics.
 *
 * Service Endpoint must be configured in Dynamics Plugin Registration Tool
 * or via API as shown below.
 */
export async function createDataverseWebhook(
  accessToken: string,
  dataverseUrl: string,
  webhookUrl: string
): Promise<string> {
  // Create service endpoint
  const endpoint = await dataverseRequest<{ serviceendpointid: string }>(
    accessToken,
    dataverseUrl,
    'serviceendpoints',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'FineGuard MTD Webhook',
        contract: 8, // WebhookSubscription
        url: webhookUrl,
        authtype: 0, // None — use shared secret in header instead
        isscheduled: false,
      }),
    }
  );

  // Register step for Invoice create/update events
  await dataverseRequest(
    accessToken,
    dataverseUrl,
    'sdkmessageprocessingsteps',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'FineGuard: Invoice Create/Update',
        'sdkmessageid@odata.bind': `/sdkmessages(name='Create')`,
        'plugintypeid@odata.bind': `/serviceendpoints(${endpoint.serviceendpointid})`,
        stage: 10, // Pre-Validation
        invocationsource: 0, // Parent
        supporteddeployment: 0, // Server Only
      }),
    }
  );

  return endpoint.serviceendpointid;
}

/**
 * Dynamics 365 App Registration Configuration
 * Copy this JSON to configure your Azure AD app registration.
 */
export const DYNAMICS_APP_REGISTRATION_CONFIG = {
  displayName: 'FineGuard MTD Connector',
  signInAudience: 'AzureADMyOrg',
  requiredResourceAccess: [
    {
      resourceAppId: '00000007-0000-0000-c000-000000000000', // Dynamics CRM
      resourceAccess: [
        {
          id: '78ce3f0f-a1ce-49c2-8cde-64b5c0896db4', // user_impersonation
          type: 'Scope',
        },
      ],
    },
  ],
  web: {
    redirectUris: ['https://your-app.azurewebsites.net/api/mcp/dynamics/callback'],
    implicitGrantSettings: {
      enableAccessTokenIssuance: false,
      enableIdTokenIssuance: false,
    },
  },
};
