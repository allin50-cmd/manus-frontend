import Link from 'next/link'
import AppIcon from './AppIcon'
import AppStatusBadge from './AppStatusBadge'
import AppHealthBadge from './AppHealthBadge'
import AppLaunchButton from './AppLaunchButton'
import type { InstalledAppSummary } from './types'

export default function AppCard({ app }: { app: InstalledAppSummary }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/[0.07]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <AppIcon appId={app.id} iconUrl={app.iconUrl} />
          <div>
            <h3 className="text-base font-semibold text-white">{app.name}</h3>
            {app.category && <p className="text-xs text-white/40 capitalize">{app.category}</p>}
          </div>
        </div>
        <AppStatusBadge status={app.status} />
      </div>

      {app.description && <p className="mt-3 text-sm text-white/60 line-clamp-2">{app.description}</p>}

      <div className="mt-4 flex items-center justify-between text-xs text-white/40">
        <span>{app.latestVersion ? `v${app.latestVersion}` : 'Version unknown'}</span>
        <AppHealthBadge appId={app.id} />
      </div>

      <div className="mt-5 flex items-center gap-2">
        <AppLaunchButton appId={app.id} launchUrl={app.launchUrl} label={`Open ${app.name}`} />
        <Link
          href={`/os/apps/${app.id}`}
          className="inline-flex items-center rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          Manage
        </Link>
      </div>
    </div>
  )
}
