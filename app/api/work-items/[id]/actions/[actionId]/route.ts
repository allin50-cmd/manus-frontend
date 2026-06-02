import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; actionId: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const action = await db.action.findUnique({ where: { id: params.actionId } })
  if (!action || action.workItemId !== params.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const result: string | null = body.result ?? null

  const updated = await db.action.update({
    where: { id: params.actionId },
    data: { status: 'Done', result, completedAt: new Date() },
  })

  await db.activityLog.create({
    data: {
      workItemId: params.id,
      actionId: params.actionId,
      person: session.person,
      eventType: 'ActionCompleted',
      summary: `Action completed: ${action.label}${result ? ` — ${result}` : ''}`,
    },
  })

  return NextResponse.json(updated)
}
