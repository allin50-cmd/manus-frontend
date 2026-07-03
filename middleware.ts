import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { COOKIE_NAME } from '@/lib/auth'

// Paths that bypass auth by exact match (no sub-paths allowed). Each of these
// routes enforces its own auth internally (e.g. a CRON_SECRET bearer header
// for machine callers with no session cookie), so middleware must let the
// request through rather than 307-redirecting it to /login first.
const PUBLIC_EXACT = new Set(['/api/alert-deliveries/ack', '/api/alert-escalation-check'])
// Paths that bypass auth by prefix match (and all their sub-paths).
const PUBLIC_PREFIX = ['/login', '/api/auth/login', '/api/auth/dev-bypass']

// Deliberately a lightweight local copy, not lib/auth.ts's verifyToken:
// middleware runs on the Edge runtime and only needs a signature/expiry
// check here, not the full session payload — importing lib/auth.ts's
// getSession()/requireAuth() would pull next/headers' request-scoped
// cookies() into the edge bundle, which isn't valid outside a route handler.
async function verifyToken(token: string): Promise<boolean> {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) return false
  try {
    await jwtVerify(token, new TextEncoder().encode(jwtSecret))
    return true
  } catch {
    return false
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = req.cookies.get(COOKIE_NAME)?.value

  if (PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIX.some((p) => pathname.startsWith(p))) {
    if (pathname.startsWith('/login') && token && (await verifyToken(token))) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  if (await verifyToken(token)) return NextResponse.next()

  const res = NextResponse.redirect(new URL('/login', req.url))
  res.cookies.delete(COOKIE_NAME)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest|.*\\.svg$|.*\\.png$).*)'],
}
