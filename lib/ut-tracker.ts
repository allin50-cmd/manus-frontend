/**
 * lib/ut-tracker.ts — lightweight fire-and-forget event tracker.
 *
 * Call trackEvent() after any major user action. It never throws and never
 * blocks the primary flow — all errors are swallowed silently.
 *
 * Event types:
 *   app_opened, company_created, contact_created, task_created, task_completed,
 *   call_logged, alert_generated, alert_acknowledged, document_uploaded,
 *   quote_created, invoice_created, message_sent, workflow_leak
 *
 * workflow_leak additionally accepts `source` and `notes`:
 *   source: whatsapp | email | spreadsheet | paper | memory | other
 */

import { getDb } from '@/lib/db'
import { utActivityEvents } from '@/db/schema'

export type UtEventType =
  | 'app_opened'
  | 'company_created'
  | 'contact_created'
  | 'task_created'
  | 'task_completed'
  | 'call_logged'
  | 'alert_generated'
  | 'alert_acknowledged'
  | 'document_uploaded'
  | 'quote_created'
  | 'invoice_created'
  | 'message_sent'
  | 'workflow_leak'

export type WorkflowLeakSource =
  | 'whatsapp'
  | 'email'
  | 'spreadsheet'
  | 'paper'
  | 'memory'
  | 'other'

export interface TrackEventOptions {
  eventType: UtEventType
  userId?: string
  source?: WorkflowLeakSource
  notes?: string
  metadata?: Record<string, unknown>
}

export async function trackEvent(opts: TrackEventOptions): Promise<void> {
  try {
    const db = await getDb()
    await db.insert(utActivityEvents).values({
      userId: opts.userId ?? null,
      eventType: opts.eventType,
      source: opts.source ?? null,
      notes: opts.notes ?? null,
      metadata: opts.metadata ?? null,
    })
  } catch {
    // Fire-and-forget: tracking must never break primary flows
  }
}
