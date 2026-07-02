import AppShell from '@/components/os/layout/AppShell'
import MetricCard from '@/components/os/cards/MetricCard'
import LauncherGrid from '@/components/os/launcher/LauncherGrid'

export default function LauncherPage() {
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

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Companies" value="24" subtitle="Active" />
          <MetricCard title="Tasks" value="18" subtitle="Open" />
          <MetricCard title="Alerts" value="3" subtitle="Need attention" />
          <MetricCard title="AI Jobs" value="7" subtitle="Running" />
        </div>

        <LauncherGrid />
      </div>
    </AppShell>
  )
}

