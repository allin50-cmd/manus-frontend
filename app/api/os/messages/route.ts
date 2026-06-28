import { NextRequest, NextResponse } from 'next/server'
import { getDb, osMessages, osMessageThreads } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq, desc } from 'drizzle-orm'
import { trackEvent } from '@/lib/ut-tracker'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const threads = await db
    .select()
    .from(osMessageThreads)
    .orderBy(desc(osMessageThreads.lastMessageAt))
    .limit(50)
  return NextResponse.json(threads)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.threadId || !body.body) {
    return NextResponse.json({ error: 'threadId and body are required' }, { status: 400 })
  }

  const db = await getDb()
  const [msg] = await db
    .insert(osMessages)
    .values({
      threadId: body.threadId,
      fromName: session.person,
      body: body.body,
      isRead: false,
    })
    .returning()

  // Update thread's last message timestamp
  await db
    .update(osMessageThreads)
    .set({ lastMessageAt: new Date() })
    .where(eq(osMessageThreads.id, body.threadId))

  await trackEvent({ eventType: 'message_sent', userId: session.person })
  return NextResponse.json(msg, { status: 201 })
}
