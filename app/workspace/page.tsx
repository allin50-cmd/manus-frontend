import Link from 'next/link'
import AppShell from '@/components/os/layout/AppShell'
import { WORKSPACES } from '@/lib/workspace-registry'

function statusClass(status: string) {
  if (status === 'ready') return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
  if (status === 'error') return 'bg-red-500/15 text-red-300 border-red-400/30'
  return 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30'
}

export default function WorkspaceCommandCentrePage() {
  const loadedAt = new Date().toLocaleString('en-GB')

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Workspace Command Centre</h1>
          <p className="mt-2 text-white/60">UltraTech OS plugin workspaces, readiness and build checklist.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {WORKSPACES.map((workspace) => (
            <article key={workspace.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-3xl" aria-hidden>{workspace.icon}</div>
                  <h2 className="mt-3 text-lg font-semibold text-white">{workspace.label}</h2>
                  <p className="mt-1 text-xs text-white/50">ID: {workspace.id}</p>
                </div>
                <span className={`rounded-full border px-2 py-1 text-xs capitalize ${statusClass(workspace.status)}`}>
                  {workspace.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-white/70">
                <div className="rounded-xl bg-black/20 p-2">
                  <div className="text-base font-semibold text-white">{workspace.commands.length}</div>
                  Commands
                </div>
                <div className="rounded-xl bg-black/20 p-2">
                  <div className="text-base font-semibold text-white">{workspace.publishes.length}</div>
                  Publishes
                </div>
                <div className="rounded-xl bg-black/20 p-2">
                  <div className="text-base font-semibold text-white">{workspace.subscribes.length}</div>
                  Subscribes
                </div>
              </div>

              <p className="mt-3 text-xs text-white/40">Last checked: {loadedAt}</p>

              <Link
                href={workspace.href}
                className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/85"
              >
                Open Workspace
              </Link>
            </article>
          ))}
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold text-white">Build Checklist</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {WORKSPACES.map((workspace) => (
              <div key={workspace.id} className="rounded-xl bg-black/20 p-4">
                <h3 className="font-semibold text-white">{workspace.label}</h3>
                <ul className="mt-3 space-y-2 text-sm text-white/70">
                  {workspace.checklist.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-emerald-300">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
