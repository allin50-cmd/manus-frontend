/**
 * FineGuard MTD API Client
 * Typed fetch wrappers for all MTD backend endpoints.
 */

const BASE = '/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Import {
  id: string;
  tenantId: string;
  source: string;
  filename: string | null;
  status: string;
  recordCount: number | null;
  errorCount: number | null;
  confidenceAvg: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceRecord {
  id: string;
  importId: string;
  tenantId: string;
  invoiceId: string | null;
  clientId: string | null;
  date: string;
  netAmount: string;
  vatAmount: string;
  vatCode: string | null;
  currency: string;
  source: string;
  confidence: string | null;
  isValid: boolean | null;
  validationErrors: ValidationError[] | null;
  createdAt: string;
}

export interface ValidationError {
  code: string;
  field: string;
  message: string;
  kbArticle: string;
  severity: 'error' | 'warning';
}

export interface McpConnector {
  id: string;
  provider: string;
  displayName: string | null;
  status: string;
  externalTenantId: string | null;
  tokenExpiresAt: string | null;
  lastSyncAt: string | null;
  createdAt: string;
  tokenExpiresIn?: number;
}

export interface MtdSubmission {
  id: string;
  periodKey: string;
  status: string;
  submittedAt: string | null;
  hmrcReceiptId: string | null;
}

export interface AuditEvent {
  id: string;
  tenantId: string;
  eventType: string;
  actorId: string | null;
  resourceType: string | null;
  resourceId: string | null;
  payloadSummary: Record<string, unknown>;
  blobUrl: string | null;
  severity: string;
  createdAt: string;
}

export interface ConnectorStatus {
  tenantId: string;
  connectors: Array<McpConnector & { tokenExpiresIn: number | null }>;
  recentSubmissions: MtdSubmission[];
  importSummary: {
    total: number;
    pending: number;
    approved: number;
    submitted: number;
  };
}

// ─── Headers ──────────────────────────────────────────────────────────────────

function headers(tenantId = 'demo-tenant'): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
  };
}

// ─── Import Endpoints ─────────────────────────────────────────────────────────

export async function uploadCsv(
  file: File,
  tenantId = 'demo-tenant',
  templateId?: string
): Promise<{ importId: string; status: string; totalRows: number; validRows: number; errors: unknown[] }> {
  const form = new FormData();
  form.append('file', file);
  if (templateId) form.append('templateId', templateId);

  const res = await fetch(`${BASE}/import/csv`, {
    method: 'POST',
    headers: { 'x-tenant-id': tenantId },
    body: form,
  });
  if (!res.ok) throw new Error(`CSV upload failed: ${(await res.json()).error}`);
  return res.json();
}

export async function uploadPdf(
  file: File,
  tenantId = 'demo-tenant'
): Promise<{ importId: string; status: string; recordCount: number; confidenceAvg: number }> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${BASE}/import/pdf`, {
    method: 'POST',
    headers: { 'x-tenant-id': tenantId },
    body: form,
  });
  if (!res.ok) throw new Error(`PDF upload failed: ${(await res.json()).error}`);
  return res.json();
}

export async function listImports(tenantId = 'demo-tenant'): Promise<Import[]> {
  const res = await fetch(`${BASE}/imports`, {
    headers: headers(tenantId),
  });
  if (!res.ok) throw new Error('Failed to load imports');
  const data = await res.json();
  return data.imports;
}

export async function getImportRecords(importId: string, tenantId = 'demo-tenant'): Promise<InvoiceRecord[]> {
  const res = await fetch(`${BASE}/imports/${importId}/records`, {
    headers: headers(tenantId),
  });
  if (!res.ok) throw new Error('Failed to load records');
  const data = await res.json();
  return data.records;
}

export async function approveImport(
  importId: string,
  approvedBy: string,
  tenantId = 'demo-tenant'
): Promise<{ importId: string; status: string }> {
  const res = await fetch(`${BASE}/imports/${importId}/approve`, {
    method: 'POST',
    headers: headers(tenantId),
    body: JSON.stringify({ approvedBy }),
  });
  if (!res.ok) throw new Error(`Approval failed: ${(await res.json()).error}`);
  return res.json();
}

// ─── MCP / Connector Endpoints ────────────────────────────────────────────────

export async function listConnectors(tenantId = 'demo-tenant'): Promise<McpConnector[]> {
  const res = await fetch(`${BASE}/mcp/accounts`, {
    headers: headers(tenantId),
  });
  if (!res.ok) throw new Error('Failed to load connectors');
  const data = await res.json();
  return data.connectors;
}

export async function createConnector(
  provider: string,
  tenantId = 'demo-tenant'
): Promise<{ connectorId: string; authUrl: string; state: string }> {
  const res = await fetch(`${BASE}/mcp/accounts`, {
    method: 'POST',
    headers: headers(tenantId),
    body: JSON.stringify({ provider }),
  });
  if (!res.ok) throw new Error(`Connector creation failed: ${(await res.json()).error}`);
  return res.json();
}

export async function refreshConnector(
  connectorId: string,
  tenantId = 'demo-tenant'
): Promise<{ connectorId: string; status: string }> {
  const res = await fetch(`${BASE}/mcp/accounts/${connectorId}/refresh`, {
    method: 'POST',
    headers: headers(tenantId),
  });
  if (!res.ok) throw new Error('Refresh failed');
  return res.json();
}

export async function getConnectorStatus(tenantId = 'demo-tenant'): Promise<ConnectorStatus> {
  const res = await fetch(`${BASE}/mcp/status/${tenantId}`, {
    headers: headers(tenantId),
  });
  if (!res.ok) throw new Error('Failed to load status');
  return res.json();
}

// ─── MTD Submission ───────────────────────────────────────────────────────────

export async function submitMtd(params: {
  idempotencyKey: string;
  vatNumber: string;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  importId?: string;
  payload?: Record<string, unknown>;
}, tenantId = 'demo-tenant'): Promise<{
  submissionId: string;
  status: string;
  receipt?: {
    formBundleNumber: string;
    processingDate: string;
    correlationId: string;
  };
  validationErrors?: ValidationError[];
}> {
  const res = await fetch(`${BASE}/mcp/submit-mtd`, {
    method: 'POST',
    headers: headers(tenantId),
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!res.ok && res.status !== 422) throw new Error(data.error ?? 'Submission failed');
  return data;
}

// ─── Audit Events ─────────────────────────────────────────────────────────────

export async function listAuditEvents(tenantId = 'demo-tenant', limit = 100): Promise<AuditEvent[]> {
  const res = await fetch(`${BASE}/mcp/audit?limit=${limit}`, {
    headers: headers(tenantId),
  });
  if (!res.ok) throw new Error('Failed to load audit events');
  const data = await res.json();
  return data.events;
}

// ─── HMRC Helpers ─────────────────────────────────────────────────────────────

export async function getHmrcAuthUrl(): Promise<{ authUrl: string; state: string }> {
  const res = await fetch(`${BASE}/mcp/hmrc/auth-url`);
  if (!res.ok) throw new Error('Failed to get HMRC auth URL');
  return res.json();
}

export async function getVatObligations(
  vatNumber: string,
  from: string,
  to: string,
  tenantId = 'demo-tenant'
): Promise<unknown[]> {
  const params = new URLSearchParams({ vatNumber, from, to });
  const res = await fetch(`${BASE}/mcp/hmrc/obligations?${params.toString()}`, {
    headers: headers(tenantId),
  });
  if (!res.ok) throw new Error('Failed to load obligations');
  const data = await res.json();
  return data.obligations;
}
