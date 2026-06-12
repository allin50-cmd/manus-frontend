import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/password'
import { timingSafeEqual } from 'crypto'

function safeEqual(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a, 'utf8')
    const bBuf = Buffer.from(b, 'utf8')
    if (aBuf.length !== bBuf.length) {
      timingSafeEqual(aBuf, aBuf)
      return false
    }
    return timingSafeEqual(aBuf, bBuf)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { currentPassword, newPassword } = body as { currentPassword: unknown; newPassword: unknown }

  if (typeof currentPassword !== 'string' || !currentPassword) {
    return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  }

  let stored
  try {
    stored = await db.userPassword.findUnique({ where: { person: session.person } })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  let currentOk: boolean
  if (stored) {
    currentOk = await verifyPassword(currentPassword, stored.hash)
  } else {
    const defaultPass = process.env.DEFAULT_PASSCODE
    if (!defaultPass) {
      return NextResponse.json({ error: 'DEFAULT_PASSCODE not configured' }, { status: 500 })
    }
    currentOk = safeEqual(currentPassword, defaultPass)
  }

  if (!currentOk) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
  }

  const hash = await hashPassword(newPassword)
  try {
    await db.userPassword.upsert({
      where: { person: session.person },
      create: { person: session.person, hash },
      update: { hash },
    })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}
