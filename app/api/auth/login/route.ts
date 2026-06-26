import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  const { passcode } = body

  const expected = process.env.APP_PASSCODE
  if (!expected) {
    return NextResponse.json(
      { error: 'APP_PASSCODE is not configured' },
      { status: 500 },
    )
  }

  if (passcode !== expected) {
    return NextResponse.json({ error: 'Incorrect passcode' }, { status: 401 })
  }

  const token = await createSessionToken('user')
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
