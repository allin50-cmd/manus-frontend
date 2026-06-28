import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  if (!body.summary) {
    return NextResponse.json(
      { error: 'summary required' },
      { status: 400 }
    )
  }

  try {
    const outreach = await db.$transaction(async (tx) => {
      const record = await tx.outreachLog.create({
        data: {
          workItemId: params.id,
          person: session.person,
          channel: body.channel ?? 'Email',
          summary: body.summary,
        },
      })

      await tx.workItem.update({
        where: { id: params.id },
        data: {
          lastTouchedAt: new Date(),
          ...(body.pipelineStage
            ? { pipelineStage: body.pipelineStage }
            : {}),
        },
      })

      return record
    })

    return NextResponse.json(outreach, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Could not create outreach record' },
      { status: 503 }
    )
  }
}
