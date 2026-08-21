import type { UserPassword } from '@prisma/client'
import { NextResponse, type NextRequest } from 'next/server'
import { createSessionToken, sessionCookieOptions, COOKIE_NAME } from '@/lib/auth'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { safeEqual } from '@/lib/safe-equal'

const KNOWN_PEOPLE = ['Dagon', 'George', 'Alissa', 'Michelle', 'Chris', 'Charlie']

function isMissingUserPasswordTable(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2021'
  )
}

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

  let stored: UserPassword | null = null
  try {
    stored = await db.userPassword.findUnique({ where: { person: person as string } })
  } catch (error) {
    // A clean deployment can temporarily have schema drift if UserPassword has
    // not been migrated yet. Treat only Prisma P2021 (missing table) as the
    // same bootstrap state as "no personal password". Real database outages
    // and all other query failures continue to fail closed.
    if (!isMissingUserPasswordTable(error)) {
      return NextResponse.json({ error: 'Authentication unavailable' }, { status: 503 })
    }
  }

  let ok: boolean
  if (stored) {
    ok = await verifyPassword(passcode, stored.hash)
  } else {
    const defaultPass = process.env.DEFAULT_PASSCODE
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
