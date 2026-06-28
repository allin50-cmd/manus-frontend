import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { trackEvent, type WorkflowLeakSource } from '@/lib/ut-tracker'

export const dynamic = 'force-dynamic'

const VALID_SOURCES: WorkflowLeakSource[] = [
  'whatsapp', 'email', 'spreadsheet', 'paper', 'memory', 'other',
]

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { source?: string; notes?: string } = {}
  try { body = await req.json() } catch { /* empty body ok */ }

  const source = (body.source ?? 'other') as WorkflowLeakSource
  if (!VALID_SOURCES.includes(source)) {
    return NextResponse.json({ error: `source must be one of: ${VALID_SOURCES.join(', ')}` }, { status: 400 })
  }

  await trackEvent({
    eventType: 'workflow_leak',
    userId: session.person,
    source,
    notes: typeof body.notes === 'string' ? body.notes.trim() : undefined,
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
