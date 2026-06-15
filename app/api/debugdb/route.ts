import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Authenticated DB diagnostic. Reports connectivity + masked connection info so
// we can see the real Prisma error without leaking credentials. Safe to keep:
// it is behind the same auth as every other route and never prints secrets.
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Parse DATABASE_URL without exposing the password.
  let dbInfo: Record<string, unknown> = { present: false }
  const raw = process.env.DATABASE_URL
  if (raw) {
    try {
      const u = new URL(raw)
      dbInfo = {
        present: true,
        host: u.hostname,
        port: u.port || '(default)',
        pgbouncer: u.searchParams.get('pgbouncer') ?? '(none)',
        connection_limit: u.searchParams.get('connection_limit') ?? '(none)',
        sslmode: u.searchParams.get('sslmode') ?? '(none)',
      }
    } catch {
      dbInfo = { present: true, parseError: 'DATABASE_URL is not a valid URL' }
    }
  }

  const directPresent = !!process.env.DIRECT_URL
  const groqPresent = !!process.env.GROQ_API_KEY

  // Try the cheapest possible query to confirm the engine + connection work.
  let connectivity: Record<string, unknown>
  try {
    const start = Date.now()
    await db.$queryRaw`SELECT 1`
    connectivity = { ok: true, ms: Date.now() - start }
  } catch (err) {
    connectivity = {
      ok: false,
      name: err instanceof Error ? err.name : 'Unknown',
      message: err instanceof Error ? err.message : String(err),
    }
  }

  return NextResponse.json({
    database: dbInfo,
    directUrlPresent: directPresent,
    groqKeyPresent: groqPresent,
    connectivity,
  })
}
