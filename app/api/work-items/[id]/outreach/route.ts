import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const VALID_PIPELINE_STAGES = [
  'Prospect', 'Contacted', 'Qualified', 'Proposal',
  'Negotiation', 'Won', 'Lost', 'Dormant'
] as const

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const logs = await db.outreachLog.findMany({
      where: { workItemId: params.id },
      orderBy: { occurredAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(logs)
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { channel?: unknown; summary?: unknown; occurredAt?: unknown; pipelineStage?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const channel = typeof body.channel === 'string' ? body.channel.trim() : ''
  const summary = typeof body.summary === 'string' ? body.summary.trim() : ''
  if (!channel) return NextResponse.json({ error: 'channel is required' }, { status: 400 })
  if (!summary) return NextResponse.json({ error: 'summary is required' }, { status: 400 })

  const occurredAt =
    typeof body.occurredAt === 'string' ? new Date(body.occurredAt) : new Date()
  const pipelineStageRaw =
    typeof body.pipelineStage === 'string' ? body.pipelineStage.trim() : undefined
  const pipelineStage =
    pipelineStageRaw && VALID_PIPELINE_STAGES.includes(pipelineStageRaw as any)
      ? pipelineStageRaw
      : undefined

  try {
    const log = await db.$transaction(async (tx) => {
      const record = await tx.outreachLog.create({
        data: { workItemId: params.id, person: session.person, channel, summary, occurredAt },
      })
      await tx.workItem.update({
        where: { id: params.id },
        data: {
          lastTouchedAt: occurredAt,
          ...(pipelineStage ? { pipelineStage: pipelineStage as any } : {}),
        },
      })
      return record
    })
    return NextResponse.json(log, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Could not create outreach record' }, { status: 503 })
  }
}
