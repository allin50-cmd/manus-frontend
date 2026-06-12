import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: false, error: 'DATABASE_URL is not configured' },
      { status: 500 }
    )
  }

  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error'
    return NextResponse.json(
      { ok: false, error: message },
      { status: 502 }
    )
  }
}
