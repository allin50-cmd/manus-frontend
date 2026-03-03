/**
 * FineGuard - HMRC Submission Idempotency Layer
 *
 * Prevents duplicate HMRC filings during network timeouts or user double-clicks.
 *
 * Strategy:
 *   1. Before any HMRC API call, generate (or retrieve) a UUID v4 idempotency key.
 *   2. The key is stored in an in-memory registry (production: Redis / DB).
 *   3. If the same key is seen again within 24 hours, the submission is BLOCKED
 *      and ERR_DUP_001 is returned — protecting the business from double-filing.
 *   4. The key is sent to HMRC as the `Gov-Client-Public-IP` / `X-Correlation-ID`
 *      header on every MTD API call.
 *
 * HMRC MTD API Documentation:
 *   https://developer.service.hmrc.gov.uk/api-documentation/docs/fraud-prevention
 *   Idempotency is enforced via the `X-Correlation-ID` header.
 */

import { v4 as uuidv4 } from 'uuid';
import type { IdempotencyRecord, SubmissionResult, ZeroVarianceErrorCode } from './types.js';
import { ERROR_MESSAGES } from './types.js';

// ============================================================================
// IN-MEMORY STORE (Replace with Redis/DB in production)
// ============================================================================

/**
 * In-memory idempotency registry.
 * Key: UUID idempotency key
 * Value: IdempotencyRecord
 *
 * In production this should be replaced with a Redis SETEX call
 * with a 24-hour TTL, or a Postgres table with a created_at + TTL index.
 */
const idempotencyStore = new Map<string, IdempotencyRecord>();

/** TTL for idempotency keys: 24 hours in milliseconds */
const KEY_TTL_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// CLEANUP TASK
// Purges expired keys to prevent memory growth.
// In production: handled by Redis TTL or a scheduled DB job.
// ============================================================================

function purgeExpiredKeys(): void {
  const now = Date.now();
  for (const [key, record] of idempotencyStore.entries()) {
    if (new Date(record.expiresAt).getTime() < now) {
      idempotencyStore.delete(key);
    }
  }
}

// Run cleanup every hour
const cleanupInterval = setInterval(purgeExpiredKeys, 60 * 60 * 1000);
// Prevent the interval from blocking process exit in tests
if (cleanupInterval.unref) cleanupInterval.unref();

// ============================================================================
// CORE IDEMPOTENCY FUNCTIONS
// ============================================================================

/**
 * Generates a new UUID v4 idempotency key and registers it in the store
 * with a 24-hour TTL.
 *
 * Call this ONCE per submission attempt, before calling the HMRC API.
 * Store the returned key on the client (e.g. in React state) so it can be
 * reused if the same request needs to be retried.
 */
export function generateIdempotencyKey(
  endpoint: string,
  payload: Record<string, unknown>,
): IdempotencyRecord {
  const key = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + KEY_TTL_MS);

  const record: IdempotencyRecord = {
    key,
    endpoint,
    payload,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  idempotencyStore.set(key, record);
  return record;
}

/**
 * Validates an incoming idempotency key before an HMRC submission.
 *
 * Returns:
 *   - { valid: true, record }      → Key exists, not yet submitted → proceed
 *   - { valid: false, isDuplicate, record }  → Key already submitted or expired
 */
export function validateIdempotencyKey(key: string): {
  valid: boolean;
  isDuplicate: boolean;
  record: IdempotencyRecord | null;
} {
  if (!key || typeof key !== 'string') {
    return { valid: false, isDuplicate: false, record: null };
  }

  const record = idempotencyStore.get(key);

  if (!record) {
    return { valid: false, isDuplicate: false, record: null };
  }

  // Check TTL
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    idempotencyStore.delete(key);
    return { valid: false, isDuplicate: false, record: null };
  }

  // Already submitted — this is a duplicate attempt
  if (record.status === 'submitted') {
    return { valid: false, isDuplicate: true, record };
  }

  return { valid: true, isDuplicate: false, record };
}

/**
 * Marks an idempotency key as successfully submitted.
 * Stores the HMRC correlation ID for audit trail purposes.
 */
export function markAsSubmitted(key: string, hmrcCorrelationId: string): void {
  const record = idempotencyStore.get(key);
  if (record) {
    record.status = 'submitted';
    record.hmrcCorrelationId = hmrcCorrelationId;
    record.submittedAt = new Date().toISOString();
    idempotencyStore.set(key, record);
  }
}

/**
 * Marks an idempotency key as failed (e.g. network error after HMRC rejected).
 * A failed key CAN be retried (it remains in 'failed' state, not 'submitted').
 */
export function markAsFailed(key: string): void {
  const record = idempotencyStore.get(key);
  if (record) {
    record.status = 'failed';
    idempotencyStore.set(key, record);
  }
}

// ============================================================================
// SUBMISSION WRAPPER
// ============================================================================

/**
 * Idempotency-safe HMRC submission wrapper.
 *
 * Wraps any HMRC API call with duplicate detection. The caller provides:
 *   - `idempotencyKey`: The UUID key generated for this submission
 *   - `submitFn`:       The actual async function that calls the HMRC API
 *
 * Flow:
 *   1. Validate the idempotency key (fail fast on duplicate)
 *   2. Execute the HMRC API call via `submitFn`
 *   3. On success: mark key as submitted, return HMRC response
 *   4. On failure: mark key as failed so the user can retry safely
 *
 * @param idempotencyKey  UUID v4 key associated with this submission
 * @param submitFn        Async function that performs the actual HMRC API call
 * @returns               SubmissionResult with full audit trail
 */
export async function idempotentSubmit(
  idempotencyKey: string,
  submitFn: (correlationId: string) => Promise<{
    hmrcCorrelationId: string;
    processingDate: string;
    paymentIndicator: 'DEBIT' | 'CREDIT' | 'NONE';
    formBundleNumber: string;
  }>,
): Promise<SubmissionResult> {
  // 1. Validate the key
  const { valid, isDuplicate, record } = validateIdempotencyKey(idempotencyKey);

  if (isDuplicate && record) {
    return {
      success: false,
      idempotencyKey,
      isDuplicate: true,
      hmrcCorrelationId: record.hmrcCorrelationId,
      message: ERROR_MESSAGES['ERR_DUP_001'],
      errorCode: 'ERR_DUP_001' as ZeroVarianceErrorCode,
    };
  }

  if (!valid) {
    return {
      success: false,
      idempotencyKey,
      isDuplicate: false,
      message: 'Invalid or expired idempotency key. Please generate a new submission key.',
    };
  }

  // 2. Execute the HMRC API call
  try {
    const hmrcResponse = await submitFn(idempotencyKey);

    // 3. Mark as successfully submitted
    markAsSubmitted(idempotencyKey, hmrcResponse.hmrcCorrelationId);

    return {
      success: true,
      idempotencyKey,
      isDuplicate: false,
      hmrcCorrelationId: hmrcResponse.hmrcCorrelationId,
      processingDate: hmrcResponse.processingDate,
      paymentIndicator: hmrcResponse.paymentIndicator,
      formBundleNumber: hmrcResponse.formBundleNumber,
      message: `Return successfully submitted to HMRC. Processing date: ${hmrcResponse.processingDate}. Form bundle: ${hmrcResponse.formBundleNumber}.`,
    };
  } catch (error) {
    // 4. Mark as failed — allows safe retry
    markAsFailed(idempotencyKey);

    return {
      success: false,
      idempotencyKey,
      isDuplicate: false,
      message: `HMRC submission failed: ${(error as Error).message}. Your idempotency key is preserved — you may retry safely.`,
    };
  }
}

/**
 * Simulated HMRC MTD VAT submission (for development/testing).
 * In production, replace with real HMRC MTD API call.
 *
 * HMRC MTD VAT Submission Endpoint:
 *   POST /organisations/vat/{vrn}/returns
 *   Headers: Authorization: Bearer {token}, X-Correlation-ID: {idempotencyKey}
 */
export async function mockHmrcVatSubmit(
  vrn: string,
  periodKey: string,
  idempotencyKey: string,
): Promise<SubmissionResult> {
  const simulatedSubmit = async (correlationId: string) => {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 200));

    // Simulate 95% success rate
    if (Math.random() < 0.05) {
      throw new Error('HMRC_503: Service temporarily unavailable');
    }

    return {
      hmrcCorrelationId: `HMRC-${correlationId.slice(0, 8).toUpperCase()}`,
      processingDate: new Date().toISOString().split('T')[0],
      paymentIndicator: 'DEBIT' as const,
      formBundleNumber: `${Date.now()}`,
    };
  };

  return idempotentSubmit(idempotencyKey, simulatedSubmit);
}

/**
 * Retrieves an idempotency record for audit/display purposes.
 */
export function getIdempotencyRecord(key: string): IdempotencyRecord | null {
  return idempotencyStore.get(key) ?? null;
}
