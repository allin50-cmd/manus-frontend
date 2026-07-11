import AppIcon from './AppIcon'
import AppStatusBadge from './AppStatusBadge'
import AppHealthBadge from './AppHealthBadge'
import AppLaunchButton from './AppLaunchButton'
import AppPermissionList from './AppPermissionList'

export interface AppDetail {
  id: string
  name: string
  description: string | null
  category: string | null
  status: string
  launchUrl: string
  manifestUrl: string
  healthUrl: string | null
  iconUrl: string | null
  latestVersion: string | null
  capabilities: string[]
  grantedPermissions: string[]
  installedAt: string
  installedBy: string | null
  tenantName: string
  installationStatus: string
}

export default function AppDetailPanel({ app }: { app: AppDetail }) {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <AppIcon appId={app.id} iconUrl={app.iconUrl} size={56} />
          <div>
            <h1 className="text-2xl font-bold text-white">{app.name}</h1>
            {app.description && <p className="mt-1 text-white/60">{app.description}</p>}
          </div>
        </div>
        <AppLaunchButton appId={app.id} launchUrl={app.launchUrl} label={`Open ${app.name}`} />
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div>
          <p className="text-xs text-white/40">Status</p>
          <div className="mt-1"><AppStatusBadge status={app.status} /></div>
        </div>
        <div>
          <p className="text-xs text-white/40">Health</p>
          <div className="mt-1"><AppHealthBadge appId={app.id} /></div>
        </div>
        <div>
          <p className="text-xs text-white/40">Version</p>
          <p className="mt-1 text-sm text-white">{app.latestVersion ?? 'Unknown'}</p>
        </div>
        <div>
          <p className="text-xs text-white/40">Category</p>
          <p className="mt-1 text-sm text-white capitalize">{app.category ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-white/40">Installed</p>
          <p className="mt-1 text-sm text-white">
            {new Date(app.installedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div>
          <p className="text-xs text-white/40">Workspace</p>
          <p className="mt-1 text-sm text-white">{app.tenantName}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Capabilities</h2>
          {app.capabilities.length === 0 ? (
            <p className="text-sm text-white/40">Not published in the app manifest.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {app.capabilities.map((capability) => (
                <span key={capability} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">
                  {capability}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Approved permissions</h2>
          <AppPermissionList permissions={app.grantedPermissions} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
        <h2 className="text-sm font-semibold text-white mb-3">Endpoints</h2>
        <dl className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-white/40">Launch URL</dt>
            <dd className="text-white/70 truncate font-mono text-xs">{app.launchUrl}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-white/40">Manifest</dt>
            <dd className="text-white/70 truncate font-mono text-xs">{app.manifestUrl}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
