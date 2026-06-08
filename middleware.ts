import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC = ['/login', '/api/auth/login', '/api/alert-deliveries/ack']

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

  const token = req.cookies.get('session')?.value

  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    if (pathname.startsWith('/login') && token && (await verifyToken(token))) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  if (await verifyToken(token)) return NextResponse.next()

  const res = NextResponse.redirect(new URL('/login', req.url))
  res.cookies.delete('session')
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest|.*\\.svg$|.*\\.png$).*)'],
}
