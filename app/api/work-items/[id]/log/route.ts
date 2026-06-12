import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let item
  try {
    item = await db.workItem.findUnique({ where: { id: params.id } })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: { text?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) return NextResponse.json({ error: 'Note text required' }, { status: 400 })

  try {
    const [log, action] = await Promise.all([
      db.activityLog.create({
        data: {
          workItemId: item.id,
          person: session.person,
          eventType: 'NoteAdded',
          summary: text,
        },
      }),
      db.action.create({
        data: {
          workItemId: item.id,
          actionType: 'LogNote',
          label: `Note: ${text.slice(0, 80)}`,
          status: 'Done',
          assignedTo: session.person,
          completedAt: new Date(),
        },
      }),
    ])
    return NextResponse.json({ log, action }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Could not save note' }, { status: 503 })
  }
}
