import { randomUUID } from 'crypto';

/** Generate a new random UUID v4 */
export function newId(): string {
  return randomUUID();
}

/** Build the canonical Temporal workflow ID for a compliance obligation */
export function workflowId(obligationId: string): string {
  return `obligation:${obligationId}`;
}

/**
 * Build a deduplication key from an ordered array of string parts.
 * Used for alert deduplication: [obligationId, urgency, channel, dueDate]
 */
export function dedupeKey(parts: string[]): string {
  return parts.join(':');
}
