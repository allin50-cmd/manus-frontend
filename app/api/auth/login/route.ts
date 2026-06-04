import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, COOKIE_NAME } from '@/lib/auth'

const KNOWN_PEOPLE = ['Dagon', 'George', 'Alissa', 'Michelle', 'Chris', 'Charlie']

export async function POST(req: NextRequest) {
  const { passcode, person } = await req.json()

  if (!KNOWN_PEOPLE.includes(person)) {
    return NextResponse.json({ error: 'Unknown person' }, { status: 401 })
  }

  const expected = process.env[`PASSCODE_${person.toUpperCase()}`]
  if (!expected) {
    return NextResponse.json({ error: `No password configured for ${person}` }, { status: 500 })
  }

  if (passcode !== expected) {
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
