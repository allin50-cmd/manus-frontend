import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC = [
  '/',
  '/login',
  '/api/auth/login',
  '/api/health/db',
  '/api/check',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) return NextResponse.redirect(new URL('/login', req.url))

  const token = req.cookies.get('session')?.value
  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  try {
    const secret = new TextEncoder().encode(jwtSecret)
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('session')
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest|.*\\.svg$|.*\\.png$).*)'],
}
