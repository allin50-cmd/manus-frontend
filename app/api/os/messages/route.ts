import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb, osMessages } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  await requireAuth()
  const db = getDb()
  const threadId = req.nextUrl.searchParams.get('threadId')

  if (!threadId) {
    return NextResponse.json({ error: 'threadId is required' }, { status: 400 })
  }

  try {
    const messages = await db.select().from(osMessages).where(eq(osMessages.threadId, threadId))
    return NextResponse.json(messages)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await requireAuth()
  const db = getDb()
  let body: { threadId: string; fromPerson: string; body: string; attachments?: string[] }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { threadId, fromPerson, body: messageBody, attachments } = body

  if (!threadId?.trim()) return NextResponse.json({ error: 'threadId is required' }, { status: 400 })
  if (!fromPerson?.trim()) return NextResponse.json({ error: 'fromPerson is required' }, { status: 400 })
  if (!messageBody?.trim()) return NextResponse.json({ error: 'body is required' }, { status: 400 })

  try {
    const message = await db.insert(osMessages).values({
      threadId,
      fromPerson,
      body: messageBody,
      attachments: attachments || [],
      isRead: false,
    }).returning()

    return NextResponse.json(message[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}
