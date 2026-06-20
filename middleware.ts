import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC = [
  '/login',
  '/api/auth/login',
  '/api/health/db',
  // FineGuard public-facing surfaces and the APIs they rely on.
  // '/' must be an exact match — handled separately below so it doesn't
  // accidentally prefix-match every route.
  '/landing',
  '/check',
  '/api/companies',
  '/api/check',
  // Stripe checkout is initiated from the public /check page; the webhook is
  // called by Stripe's servers and authenticates via signature, not session.
  '/api/stripe',
  // Legal pages — publicly accessible, no auth required.
  '/privacy',
  '/terms',
]

// The homepage is public but '/' would prefix-match every path, so we check
// it explicitly before the startsWith loop.
const PUBLIC_EXACT = ['/']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_EXACT.includes(pathname)) return NextResponse.next()
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next()

  // API routes get a JSON 401 instead of an HTML redirect so client fetches
  // can distinguish "not signed in" from a successful response.
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
