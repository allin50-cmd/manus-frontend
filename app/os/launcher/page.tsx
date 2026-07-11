import AppShell from '@/components/os/layout/AppShell'
import MetricCard from '@/components/os/cards/MetricCard'
import GlobalCommandInput from '@/components/os/command/GlobalCommandInput'
import LauncherGrid from '@/components/os/launcher/LauncherGrid'
import InstalledAppsSummary, { type InstalledAppsSummaryData } from '@/components/os/apps/InstalledAppsSummary'
import { db } from '@/lib/db'
import { checkAppHealth } from '@/lib/apps/health'

export const dynamic = 'force-dynamic'

async function loadInstalledAppsSummary(): Promise<InstalledAppsSummaryData | null> {
  try {
    const installations = await db.workspaceAppInstallation.findMany({
      where: { status: 'active' },
      include: { app: true },
      orderBy: { installedAt: 'asc' },
    })

    if (installations.length === 0) return null

    const healthResults = await Promise.all(
      installations.map((i: any) => checkAppHealth(i.app.healthUrl))
    )
    const unhealthyCount = healthResults.filter((r) => r.status === 'error').length

    const recentEvents = await db.appEvent.findMany({
      where: { eventType: 'app.launched' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { app: true },
    })

    return {
      totalInstalled: installations.length,
      unhealthyCount,
      quickLaunch: installations.map((i: any) => ({
        id: i.app.id,
        name: i.app.name,
        description: i.app.description,
        launchUrl: i.app.launchUrl,
        iconUrl: i.app.iconUrl,
      })),
      recentLaunches: recentEvents.map((e: any) => ({
        appName: e.app.name,
        appId: e.appId,
        launchedAt: e.createdAt.toISOString(),
      })),
    }
  } catch (err) {
    console.error('Failed to load installed apps summary:', err)
    return null
  }
}

export default async function LauncherPage() {
  const appsSummary = await loadInstalledAppsSummary()

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            UltraTech OS
          </h1>

          <p className="mt-2 text-white/60">
            Operations Launcher
          </p>
        </div>

        <GlobalCommandInput />

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Companies" value="24" subtitle="Active" />
          <MetricCard title="Tasks" value="18" subtitle="Open" />
          <MetricCard title="Alerts" value="3" subtitle="Need attention" />
          <MetricCard title="AI Jobs" value="7" subtitle="Running" />
        </div>

        <LauncherGrid />

        {appsSummary && <InstalledAppsSummary data={appsSummary} />}
      </div>
    </AppShell>
  )
}
