import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, sessionCookieOptions, COOKIE_NAME } from '@/lib/auth'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { safeEqual } from '@/lib/safe-equal'

const KNOWN_PEOPLE = ['Dagon', 'George', 'Alissa', 'Michelle', 'Chris', 'Charlie']
const DEMO_PASSCODE = 'demo1234'

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

  let stored = null
  try {
    stored = await db.userPassword.findUnique({ where: { person: person as string } })
  } catch {
    stored = null
  }

  let ok: boolean
  if (stored) {
    ok = await verifyPassword(passcode, stored.hash)
  } else {
    const defaultPass = process.env.DEFAULT_PASSCODE || DEMO_PASSCODE
    ok = safeEqual(passcode, defaultPass)
  }

  if (!ok) {
    return NextResponse.json({ error: 'Incorrect passcode' }, { status: 401 })
  }

  const token = await createSessionToken(person as string)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, sessionCookieOptions(req))
  return res
}
