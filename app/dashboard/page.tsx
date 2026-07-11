import Link from 'next/link'
import AppShell from '@/components/os/layout/AppShell'
import MetricCard from '@/components/os/cards/MetricCard'
import GlobalCommandInput from '@/components/os/command/GlobalCommandInput'
import LauncherGrid from '@/components/os/launcher/LauncherGrid'
import { requireAuth } from '../../lib/auth'

export const dynamic = 'force-dynamic'

const executionItems = [
  {
    title: 'Action parser',
    status: 'Ready',
    detail: 'Natural-language commands route through /api/parse-action.',
    href: '/os/parser',
  },
  {
    title: 'Execution preview',
    status: 'Mock queue',
    detail: 'Parsed actions show confidence, missing fields, and confirm state before execution.',
    href: '/os/parser',
  },
  {
    title: 'Launcher modules',
    status: '8 apps',
    detail: 'Money, Messages, Calls, Contacts, Alerts, Tasks, Companies, and Documents.',
    href: '/os/launcher',
  },
]

const quickActions = [
  { label: 'Open parser', href: '/os/parser' },
  { label: 'New task', href: '/work-items/new' },
  { label: 'New contact', href: '/os/contacts/new' },
  { label: 'Upload document', href: '/os/documents/upload' },
]

export default async function DashboardPage() {
  const session = await requireAuth()
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase()

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">{today}</p>
              <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Business Command Hub</h1>
              <p className="mt-3 text-sm leading-6 text-white/60 md:text-base">
                Welcome back, <span className="font-semibold text-white">{session.person}</span>. This is the current UltraTech OS hub for commands, execution previews, live work, and module launch.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-cyan-300/60 hover:text-white"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <GlobalCommandInput />

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Parser" value="Live" subtitle="Command intake ready" />
          <MetricCard title="Queue" value="Preview" subtitle="Mock execution enabled" />
          <MetricCard title="Modules" value="8" subtitle="Core apps wired" />
          <MetricCard title="Status" value="Current" subtitle="Legacy dashboard replaced" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Execution Control</h2>
                <p className="mt-1 text-sm text-white/50">Current action-parser work is now surfaced from the main dashboard.</p>
              </div>
              <Link href="/os/parser" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">
                Test parser
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {executionItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="block rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <p className="mt-1 text-sm text-white/55">{item.detail}</p>
                    </div>
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                      {item.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-xl font-semibold text-white">What changed</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-white/60">
              <p>The old compliance-only dashboard has been removed from this route.</p>
              <p>The default dashboard now matches the newer OS direction: command input, parser access, launcher modules, and execution status.</p>
              <p>Compliance pages are still available from Filings, Alerts, Portfolio, and Today where needed.</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Launch apps</h2>
              <p className="mt-1 text-sm text-white/50">Single workspace, no old app silos.</p>
            </div>
            <Link href="/os/launcher" className="text-sm font-semibold text-cyan-200 hover:text-cyan-100">
              Full launcher →
            </Link>
          </div>
          <LauncherGrid />
        </section>
      </div>
    </AppShell>
  )
}
