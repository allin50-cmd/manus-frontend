import type { UserPassword } from '@prisma/client'
import { NextResponse, type NextRequest } from 'next/server'
import { createSessionToken, sessionCookieOptions, COOKIE_NAME } from '@/lib/auth'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { safeEqual } from '@/lib/safe-equal'

const KNOWN_PEOPLE = ['Dagon', 'George', 'Alissa', 'Michelle', 'Chris', 'Charlie']

export async function POST(req: NextRequest) {
  let body: { passcode?: unknown; person?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { passcode, person } = body

  if (!KNOWN_PEOPLE.includes(person as string)) {
    return NextResponse.json({ error: 'Unknown person' }, { status: 401 })
  }

  if (typeof passcode !== 'string' || !passcode) {
    return NextResponse.json({ error: 'Incorrect passcode' }, { status: 401 })
  }

  const defaultPass = process.env.DEFAULT_PASSCODE
  const isLocalRequest = ['localhost', '127.0.0.1', '::1'].includes(req.nextUrl.hostname)

  let stored: UserPassword | null
  try {
    stored = await db.userPassword.findUnique({ where: { person: person as string } })
  } catch {
    // Local development must remain usable when the database is offline. Only
    // allow the configured fallback passcode on loopback; deployed requests
    // continue to fail closed if the password store cannot be reached.
    if (!isLocalRequest || !defaultPass) {
      return NextResponse.json({ error: 'Authentication unavailable' }, { status: 503 })
    }
    stored = null
  }

  let ok: boolean
  if (stored) {
    ok = await verifyPassword(passcode, stored.hash)
  } else {
    if (!defaultPass) {
      return NextResponse.json({ error: 'Authentication unavailable' }, { status: 503 })
    }
    ok = safeEqual(passcode, defaultPass)
  }

  if (!ok) {
    return NextResponse.json({ error: 'Incorrect passcode' }, { status: 401 })
  }

  let token: string
  try {
    token = await createSessionToken(person as string)
  } catch {
    return NextResponse.json({ error: 'Authentication unavailable' }, { status: 503 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, sessionCookieOptions(req))
  return res
}
