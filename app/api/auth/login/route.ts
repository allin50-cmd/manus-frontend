import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, COOKIE_NAME } from '@/lib/auth'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'

const KNOWN_PEOPLE = ['Dagon', 'George', 'Alissa', 'Michelle', 'Chris', 'Charlie']

export async function POST(req: NextRequest) {
  const { passcode, person } = await req.json()

  if (!KNOWN_PEOPLE.includes(person)) {
    return NextResponse.json({ error: 'Unknown person' }, { status: 401 })
  }

  if (typeof passcode !== 'string' || !passcode) {
    return NextResponse.json({ error: 'Incorrect passcode' }, { status: 401 })
  }

  let stored
  try {
    stored = await db.userPassword.findUnique({ where: { person } })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  let ok: boolean
  if (stored) {
    ok = await verifyPassword(passcode, stored.hash)
  } else {
    const defaultPass = process.env.DEFAULT_PASSCODE
    if (!defaultPass) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }
    ok = passcode === defaultPass
  }

  if (!ok) {
    return NextResponse.json({ error: 'Incorrect passcode' }, { status: 401 })
  }

  const token = await createSessionToken(person)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
