import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { getCurrentTenantId } from '@/lib/apps/tenant'

export const dynamic = 'force-dynamic'

// Records a real launch event so "recently opened" reflects actual usage —
// never fabricated. Failing to log never blocks the app from opening;
// the client fires this best-effort alongside navigation.
export async function POST(_req: Request, { params }: { params: Promise<{ appId: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { appId } = await params

  try {
    const tenantId = await getCurrentTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const installation = await db.workspaceAppInstallation.findFirst({
      where: { appId, status: 'active', tenantId },
      include: { app: true },
    })

    if (!installation) {
      return NextResponse.json({ error: 'App not installed' }, { status: 404 })
    }

    await db.appEvent.create({
      data: {
        appId,
        tenantId: installation.tenantId,
        eventType: 'app.launched',
        payload: { launchedBy: session.person },
      },
    })

    return NextResponse.json({ launchUrl: installation.app.launchUrl })
  } catch (err) {
    console.error('Failed to record launch event:', err)
    // Non-fatal — the app should still open even if logging failed.
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
