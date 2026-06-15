import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { daysSinceLastTouch } from '@/lib/crm-utils'

export const runtime = 'nodejs'

const PIPELINE_TYPES = ['Partnership', 'ConstructionLead', 'PlanningLead'] as const
type PipelineType = (typeof PIPELINE_TYPES)[number]

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const typeParam = searchParams.get('type')
  const stageParam = searchParams.get('stage')

  const where: Record<string, unknown> = {}

  if (typeParam) {
    if (!(PIPELINE_TYPES as readonly string[]).includes(typeParam)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
    where.type = typeParam as PipelineType
  } else {
    where.type = { in: PIPELINE_TYPES as unknown as PipelineType[] }
  }

  if (stageParam) {
    where.pipelineStage = stageParam
  }

  try {
    const items = await db.workItem.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        companyRef: { select: { id: true, name: true } },
        contactRef: { select: { id: true, name: true, role: true, email: true, phone: true } },
        outreachLogs: {
          orderBy: { occurredAt: 'desc' },
          take: 1,
        },
      },
    })

    const result = items.map((item) => ({
      ...item,
      daysSinceLastTouch: daysSinceLastTouch(item.outreachLogs),
    }))

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Could not load pipeline items' }, { status: 503 })
  }
}
