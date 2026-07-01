import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, COOKIE_NAME } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (process.env.DISABLE_AUTH !== 'true') {
    return NextResponse.json({ disabled: false }, { status: 401 })
  }

  const defaultPerson = 'Dagon'
  const token = await createSessionToken(defaultPerson)
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
