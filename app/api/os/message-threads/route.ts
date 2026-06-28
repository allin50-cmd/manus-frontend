import { NextRequest, NextResponse } from 'next/server'
import { getDb, osMessageThreads } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.subject) return NextResponse.json({ error: 'subject is required' }, { status: 400 })

  const db = await getDb()
  const [thread] = await db
    .insert(osMessageThreads)
    .values({
      subject: body.subject,
      participantNames: [session.person],
      linkedWorkItemId: body.linkedWorkItemId || null,
    })
    .returning()

  return NextResponse.json(thread, { status: 201 })
}
