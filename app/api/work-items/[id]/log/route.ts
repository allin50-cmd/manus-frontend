import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const item = await db.workItem.findUnique({ where: { id: params.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Note text required' }, { status: 400 })

  const [log, action] = await Promise.all([
    db.activityLog.create({
      data: {
        workItemId: item.id,
        person: session.person,
        eventType: 'NoteAdded',
        summary: text.trim(),
      },
    }),
    db.action.create({
      data: {
        workItemId: item.id,
        actionType: 'LogNote',
        label: `Note: ${text.trim().slice(0, 80)}`,
        status: 'Done',
        assignedTo: session.person,
        completedAt: new Date(),
      },
    }),
  ])

  return NextResponse.json({ log, action }, { status: 201 })
}
