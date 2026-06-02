import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const COOKIE_NAME = 'session'

function secret() {
  return new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-dev-secret-change-in-prod')
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
