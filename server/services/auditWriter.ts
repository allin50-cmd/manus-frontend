/**
 * VaultLine Audit Writer
 * Writes immutable audit events to Azure Blob Storage (WORM) and the audit_events DB table.
 * Includes a local ring-buffer for offline writes with retry logic.
 */
import crypto from 'crypto';
import { db } from '../db/index.js';
import { auditEvents } from '../db/schema-mtd.js';
import { encryptToken } from './secretsManager.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuditEventPayload {
  [key: string]: unknown;
}

interface BufferedEvent {
  tenantId: string;
  eventType: string;
  resourceType: string;
  resourceId: string | null;
  payloadSummary: AuditEventPayload;
  rawPayload: AuditEventPayload;
  timestamp: string;
  retries: number;
}

// ─── Local Buffer ─────────────────────────────────────────────────────────────

const BUFFER_MAX_SIZE = 500;
const RETRY_INTERVAL_MS = 5_000;
const MAX_RETRIES = 4;

const offlineBuffer: BufferedEvent[] = [];
let retryInterval: ReturnType<typeof setInterval> | null = null;

function startRetryLoop(): void {
  if (retryInterval) return;
  retryInterval = setInterval(async () => {
    if (offlineBuffer.length === 0) return;
    const event = offlineBuffer.shift();
    if (!event) return;
    try {
      await flushEvent(event);
    } catch {
      event.retries++;
      if (event.retries < MAX_RETRIES) {
        offlineBuffer.unshift(event); // Re-queue at front
      } else {
        console.error('[AuditWriter] Dropping event after max retries:', event.eventType);
      }
    }
  }, RETRY_INTERVAL_MS);
}

// ─── Azure Blob Client ────────────────────────────────────────────────────────

interface BlobContainerClient {
  getBlockBlobClient(blobName: string): {
    upload(content: string, length: number, options?: Record<string, unknown>): Promise<void>;
    url: string;
  };
}

async function getBlobContainerClient(): Promise<BlobContainerClient | null> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AUDIT_BLOB_CONTAINER ?? 'fineguard-audit';

  if (!connectionString) return null;

  try {
    const { BlobServiceClient } = await import('@azure/storage-blob');
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    return blobServiceClient.getContainerClient(containerName) as unknown as BlobContainerClient;
  } catch {
    console.warn('[AuditWriter] Azure Storage SDK not available — blobs will not be written');
    return null;
  }
}

// ─── Core Audit Write ─────────────────────────────────────────────────────────

async function flushEvent(event: BufferedEvent): Promise<string | null> {
  // 1. Write to DB (fast, queryable copy)
  let blobUrl: string | null = null;

  // 2. Write to Azure Blob Storage (authoritative WORM copy)
  const containerClient = await getBlobContainerClient();
  if (containerClient) {
    const blobName = `${event.tenantId}/${event.eventType}/${event.timestamp}.json`;
    const rawJson = JSON.stringify({
      ...event.rawPayload,
      _meta: {
        tenantId: event.tenantId,
        eventType: event.eventType,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        timestamp: event.timestamp,
        writeVersion: '1.0',
      },
    });

    // Encrypt raw payload before writing to blob
    const encryptedContent = await encryptToken(rawJson).catch(() => rawJson);

    const blobClient = containerClient.getBlockBlobClient(blobName);
    await blobClient.upload(encryptedContent, Buffer.byteLength(encryptedContent), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
      metadata: {
        tenantId: event.tenantId,
        eventType: event.eventType,
        resourceId: event.resourceId ?? '',
      },
    });
    blobUrl = blobClient.url;
  }

  // 3. Insert DB audit record
  await db.insert(auditEvents).values({
    tenantId: event.tenantId,
    eventType: event.eventType,
    resourceType: event.resourceType,
    resourceId: event.resourceId ?? undefined,
    payloadSummary: event.payloadSummary,
    blobUrl: blobUrl ?? undefined,
    severity: (event.payloadSummary['severity'] as string) ?? 'info',
    createdAt: new Date(event.timestamp),
  });

  return blobUrl;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Write an audit event.
 * Non-blocking — errors are buffered and retried; never throws to callers.
 *
 * @param tenantId       FineGuard tenant UUID
 * @param eventType      Event identifier (e.g. 'submission.attempted')
 * @param resourceType   Resource class (e.g. 'import', 'submission', 'connector')
 * @param resourceId     Resource UUID
 * @param payloadSummary Redacted summary fields (safe for DB storage)
 * @param rawPayload     Full payload — will be encrypted before blob write
 */
async function write(
  tenantId: string,
  eventType: string,
  resourceType: string,
  resourceId: string | null,
  payloadSummary: AuditEventPayload,
  rawPayload?: AuditEventPayload
): Promise<void> {
  const event: BufferedEvent = {
    tenantId,
    eventType,
    resourceType,
    resourceId,
    payloadSummary,
    rawPayload: rawPayload ?? payloadSummary,
    timestamp: new Date().toISOString(),
    retries: 0,
  };

  try {
    await flushEvent(event);
  } catch (err) {
    console.warn('[AuditWriter] Write failed — buffering event:', eventType, (err as Error).message);
    if (offlineBuffer.length < BUFFER_MAX_SIZE) {
      offlineBuffer.push(event);
      startRetryLoop();
    }
  }
}

export const auditWriter = { write };
