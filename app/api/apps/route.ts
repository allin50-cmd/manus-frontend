import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const installations = await db.workspaceAppInstallation.findMany({
      where: { status: 'active' },
      include: { app: true },
      orderBy: { installedAt: 'asc' },
    })

    const apps = installations.map((i: any) => ({
      id: i.app.id,
      name: i.app.name,
      description: i.app.description,
      category: i.app.category,
      status: i.app.status,
      launchUrl: i.app.launchUrl,
      manifestUrl: i.app.manifestUrl,
      healthUrl: i.app.healthUrl,
      iconUrl: i.app.iconUrl,
      latestVersion: i.app.latestVersion,
      pwa: i.app.pwa,
      installationStatus: i.status,
      installedAt: i.installedAt,
    }))

    return NextResponse.json({ apps })
  } catch (err) {
    console.error('Failed to load installed apps:', err)
    return NextResponse.json({ error: 'Registry temporarily unavailable', apps: [] }, { status: 503 })
  }
}
