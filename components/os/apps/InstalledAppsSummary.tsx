import Link from 'next/link'
import MetricCard from '@/components/os/cards/MetricCard'
import AppIcon from './AppIcon'
import AppLaunchButton from './AppLaunchButton'

export interface InstalledAppsSummaryData {
  totalInstalled: number
  unhealthyCount: number
  quickLaunch: { id: string; name: string; description: string | null; launchUrl: string; iconUrl: string | null }[]
  recentLaunches: { appName: string; appId: string; launchedAt: string }[]
}

export default function InstalledAppsSummary({ data }: { data: InstalledAppsSummaryData }) {
  if (data.totalInstalled === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Installed Apps</h2>
        <Link href="/os/apps" className="text-sm text-white/50 hover:text-white transition">
          View all →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Installed" value={String(data.totalInstalled)} subtitle="Applications" />
        <MetricCard
          title="Needs attention"
          value={String(data.unhealthyCount)}
          subtitle={data.unhealthyCount === 1 ? 'App unhealthy' : 'Apps unhealthy'}
        />
        {data.recentLaunches.length > 0 && (
          <MetricCard
            title="Last opened"
            value={data.recentLaunches[0].appName}
            subtitle={new Date(data.recentLaunches[0].launchedAt).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.quickLaunch.map((app) => (
          <div key={app.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <AppIcon appId={app.id} iconUrl={app.iconUrl} size={32} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{app.name}</p>
                {app.description && <p className="text-xs text-white/40 truncate">{app.description}</p>}
              </div>
            </div>
            <AppLaunchButton
              appId={app.id}
              launchUrl={app.launchUrl}
              label="Open"
              className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
