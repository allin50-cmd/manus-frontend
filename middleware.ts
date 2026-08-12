import { type NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/session-token'

// Paths that bypass auth by exact match (no sub-paths allowed).
const PUBLIC_EXACT = new Set(['/api/alert-deliveries/ack'])
// Paths that bypass auth by prefix match (and all their sub-paths).
const PUBLIC_PREFIX = ['/login', '/api/auth/login', '/api/auth/dev-bypass']

async function hasValidSession(token: string): Promise<boolean> {
  return (await verifySessionToken(token)) !== null
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('session')?.value

  if (PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIX.some((p) => pathname.startsWith(p))) {
    if (pathname.startsWith('/login') && token && (await hasValidSession(token))) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  if (await hasValidSession(token)) return NextResponse.next()

  const res = NextResponse.redirect(new URL('/login', req.url))
  res.cookies.delete('session')
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest|.*\\.svg$|.*\\.png$).*)'],
}
