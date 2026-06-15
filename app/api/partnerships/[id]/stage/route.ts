import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { PipelineStage } from '@prisma/client'
import { stageLabel, isStagValidForType } from '@/lib/crm-utils'

export const runtime = 'nodejs'

const VALID_PIPELINE_STAGES = Object.values(PipelineStage)

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { stage } = body
  if (typeof stage !== 'string' || !VALID_PIPELINE_STAGES.includes(stage as PipelineStage)) {
    return NextResponse.json({ error: 'Invalid pipeline stage' }, { status: 400 })
  }

  let item
  try {
    item = await db.workItem.findUnique({ where: { id: params.id } })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!isStagValidForType(stage, item.type)) {
    return NextResponse.json(
      { error: `Stage "${stage}" is not valid for work item type "${item.type}"` },
      { status: 400 },
    )
  }

  let updated
  try {
    updated = await db.workItem.update({
      where: { id: params.id },
      data: { pipelineStage: stage as PipelineStage },
    })
  } catch {
    return NextResponse.json({ error: 'Could not update pipeline stage' }, { status: 503 })
  }

  await db.activityLog
    .create({
      data: {
        workItemId: params.id,
        person: session.person,
        eventType: 'StatusChanged',
        summary: `Pipeline stage changed to ${stageLabel(stage)}`,
        newStatus: stage,
      },
    })
    .catch(() => {})

  return NextResponse.json(updated)
}
