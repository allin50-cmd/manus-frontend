import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import {
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
} from '@/lib/session-token'

export const COOKIE_NAME = 'session'
export { createSessionToken }

// NODE_ENV alone isn't a reliable signal for the Secure cookie flag: it's
// 'production' for `next start` even when served over plain HTTP (e.g. a
// local prod build, or a non-TLS deployment), and browsers silently drop
// Secure cookies on the reply to any http:// request — breaking login with
// no visible error. Key off the request's actual scheme instead.
export function sessionCookieOptions(req: NextRequest) {
  const isHttps = req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:'
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  }
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  return verifySessionToken(token)
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}
