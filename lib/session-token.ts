import { SignJWT, jwtVerify } from 'jose'

export type SessionPayload = { person: string }

function jwtSecret(): Uint8Array {
  const value = process.env.JWT_SECRET
  if (!value) throw new Error('JWT_SECRET is required')
  return new TextEncoder().encode(value)
}

export async function createSessionToken(person: string): Promise<string> {
  return new SignJWT({ person })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(jwtSecret())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, jwtSecret())
    if (typeof payload.person !== 'string' || !payload.person) return null
    return { person: payload.person }
  } catch {
    return null
  }
}
