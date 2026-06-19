import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC = [
  '/login',
  '/api/auth/login',
  '/api/health/db',
  // FineGuard public-facing surfaces and the company lookup they rely on.
  '/landing',
  '/check',
  '/api/companies',
  // Stripe checkout is initiated from the public /check page; the webhook is
  // called by Stripe's servers and authenticates via signature, not session.
  '/api/stripe',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next()

  // API routes get a JSON 401 instead of an HTML redirect so client fetches
  // can distinguish "not signed in" from a successful response.
  const isApi = pathname.startsWith('/api/')

  const unauthorized = () =>
    isApi
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', req.url))

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
