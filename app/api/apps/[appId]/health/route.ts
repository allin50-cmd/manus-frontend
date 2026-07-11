import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkAppHealth } from '@/lib/apps/health'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ appId: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { appId } = await params

  const app = await db.app.findUnique({ where: { id: appId } })
  if (!app) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 })
  }

  const result = await checkAppHealth(app.healthUrl)
  return NextResponse.json(result)
}
