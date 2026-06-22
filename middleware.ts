import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC = [
  // ── Auth ─────────────────────────────────────────────────────────────────
  '/login',
  '/api/auth/login',
  '/api/health/db',

  // ── FineGuard — public customer-facing routes ─────────────────────────
  '/landing',
  '/check',
  '/api/companies',
  '/api/check',
  '/api/stripe',
  '/api/fineguard-leads',
  '/privacy',
  '/terms',

  // ── FineGuard — intake ────────────────────────────────────────────────
  '/intake/fineguard',
]

// '/' is public but must be exact-matched to avoid prefix-matching everything.
const PUBLIC_EXACT = ['/']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_EXACT.includes(pathname)) return NextResponse.next()
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next()

  const isApi = pathname.startsWith('/api/')

  const unauthorized = () => {
    if (isApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) return unauthorized()

  const token = req.cookies.get('session')?.value
  if (!token) return unauthorized()

  try {
    const secret = new TextEncoder().encode(jwtSecret)
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    const res = unauthorized()
    res.cookies.delete('session')
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest|.*\\.svg$|.*\\.png$).*)'],
}
