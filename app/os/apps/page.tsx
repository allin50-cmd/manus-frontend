import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import AppShell from '@/components/os/layout/AppShell'
import InstalledAppsGrid from '@/components/os/apps/InstalledAppsGrid'
import EmptyAppsState from '@/components/os/apps/EmptyAppsState'
import type { InstalledAppSummary } from '@/components/os/apps/types'

export const dynamic = 'force-dynamic'

export default async function AppsPage() {
  await requireAuth()

  let apps: InstalledAppSummary[] = []
  let loadError = false

  try {
    const installations = await db.workspaceAppInstallation.findMany({
      where: { status: 'active' },
      include: { app: true },
      orderBy: { installedAt: 'asc' },
    })

    apps = installations.map((i: any) => ({
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
      installedAt: i.installedAt.toISOString(),
    }))
  } catch (err) {
    console.error('Failed to load installed apps:', err)
    loadError = true
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Apps</h1>
          <p className="mt-2 text-white/60">Installed applications for this workspace</p>
        </div>

        {loadError ? (
          <EmptyAppsState message="Couldn't reach the app registry right now. Try again shortly." />
        ) : (
          <InstalledAppsGrid apps={apps} />
        )}
      </div>
    </AppShell>
  )
}
