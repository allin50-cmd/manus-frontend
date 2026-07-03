import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, sessionCookieOptions, COOKIE_NAME } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (process.env.DISABLE_AUTH !== 'true') {
    return NextResponse.json({ disabled: false }, { status: 401 })
  }

  const defaultPerson = 'Dagon'
  const token = await createSessionToken(defaultPerson)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, sessionCookieOptions(req))
  return res
}
