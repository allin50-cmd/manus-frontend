import Link from 'next/link'
import { notFound } from 'next/navigation'
import ParserPlayground from '@/components/os/parser/ParserPlayground'
import AppShell from '@/components/os/layout/AppShell'
import ParsedJobsPanel from '@/components/workspace/ParsedJobsPanel'
import WhiteLabelServicesWorkspace from '@/components/workspace/WhiteLabelServicesWorkspace'
import { getWorkspace } from '@/lib/workspace-registry'

interface WorkspacePageProps {
  params: {
    workspaceId: string
  }
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const workspace = getWorkspace(params.workspaceId)
  if (!workspace) notFound()

  if (workspace.id === 'white-label-services') {
    return (
      <AppShell>
        <WhiteLabelServicesWorkspace />
      </AppShell>
    )
  }

  if (workspace.id === 'command-parser') {
    return (
      <AppShell>
        <div className="space-y-6">
          <div>
            <Link href="/workspace" className="text-sm text-white/50 hover:text-white">
              ← Workspace Command Centre
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-white">Command Parser</h1>
            <p className="mt-2 text-white/60">Parse user instructions and preview UltraTech OS actions.</p>
          </div>
          <ParserPlayground />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Link href="/workspace" className="text-sm text-white/50 hover:text-white">
            ← Workspace Command Centre
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-white">{workspace.label}</h1>
          <p className="mt-2 text-white/60">Workspace route is registered and ready for the next implementation pass.</p>
        </div>

        {workspace.id === 'todays-work' && <ParsedJobsPanel />}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold text-white">Runtime Contract</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-xs text-white/50">Commands</p>
              <p className="mt-2 text-2xl font-bold text-white">{workspace.commands.length}</p>
            </div>
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-xs text-white/50">Publishes</p>
              <p className="mt-2 text-2xl font-bold text-white">{workspace.publishes.length}</p>
            </div>
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-xs text-white/50">Subscribes</p>
              <p className="mt-2 text-2xl font-bold text-white">{workspace.subscribes.length}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold text-white">Build Checklist</h2>
          <ul className="mt-4 space-y-2 text-white/70">
            {workspace.checklist.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-emerald-300">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  )
}
