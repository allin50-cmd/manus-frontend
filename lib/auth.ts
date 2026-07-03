import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

export const COOKIE_NAME = 'session'

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

function secret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET env var is not set')
  return new TextEncoder().encode(s)
}

export async function createSessionToken(person: string): Promise<string> {
  return new SignJWT({ person })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret())
}

export async function verifyToken(token: string): Promise<{ person: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload as { person: string }
  } catch {
    return null
  }
}

export async function getSession(): Promise<{ person: string } | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function requireAuth(): Promise<{ person: string }> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}
