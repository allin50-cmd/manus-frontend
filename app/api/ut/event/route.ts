import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { trackEvent, type UtEventType } from '@/lib/ut-tracker'

export const dynamic = 'force-dynamic'

const VALID_TYPES: UtEventType[] = [
  'app_opened', 'company_created', 'contact_created', 'task_created', 'task_completed',
  'call_logged', 'alert_generated', 'alert_acknowledged', 'document_uploaded',
  'quote_created', 'invoice_created', 'message_sent',
]

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { eventType?: string; metadata?: Record<string, unknown> } = {}
  try { body = await req.json() } catch { /* empty body ok */ }

  const eventType = body.eventType as UtEventType | undefined
  if (!eventType || !VALID_TYPES.includes(eventType)) {
    return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 })
  }

  await trackEvent({ eventType, userId: session.person, metadata: body.metadata })
  return NextResponse.json({ success: true }, { status: 201 })
}
