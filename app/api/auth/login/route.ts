import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, COOKIE_NAME } from '@/lib/auth'

const KNOWN_PEOPLE = ['Dagon', 'George', 'Alissa', 'Michelle', 'Chris', 'Charlie']

export async function POST(req: NextRequest) {
  const { passcode, person } = await req.json()

  const expected = process.env.APP_PASSCODE
  if (!expected) {
    return NextResponse.json({ error: 'APP_PASSCODE not configured' }, { status: 500 })
  }

  if (passcode !== expected) {
    return NextResponse.json({ error: 'Incorrect passcode' }, { status: 401 })
  }

  const resolvedPerson = KNOWN_PEOPLE.includes(person) ? person : (person || 'user')
  const token = await createSessionToken(resolvedPerson)
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
