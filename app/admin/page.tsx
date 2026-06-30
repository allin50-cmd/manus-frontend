import { requireAuth } from '@/lib/auth'
import { getDb, workItems } from '@/lib/db'
import { monitoredCompanies, fineguardLeads } from '@/db/schema'
import { count, notInArray } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getAdminStats() {
  const db = await getDb()

  const [activeMonitoredRes, totalLeadsRes, activeWorkItemsRes] = await Promise.all([
    db.select({ count: count() }).from(monitoredCompanies),
    db.select({ count: count() }).from(fineguardLeads),
    db.select({ count: count() }).from(workItems).where(
      notInArray(workItems.status, ['Archived'])
    ),
  ])

  return {
    activeMonitored: Number(activeMonitoredRes[0]?.count ?? 0),
    totalLeads: Number(totalLeadsRes[0]?.count ?? 0),
    activeWorkItems: Number(activeWorkItemsRes[0]?.count ?? 0),
  }
}

export default async function AdminPage() {
  const session = await requireAuth()
  const stats = await getAdminStats()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
        <p className="text-slate-500 text-sm mt-1">Private — {session.person}</p>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">FineGuard</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-3">
          <StatCard label="Monitored companies" value={stats.activeMonitored} />
          <StatCard label="Leads captured" value={stats.totalLeads} />
        </div>
        <div className="flex gap-4 flex-wrap">
          <Link href="/portal" className="text-sm text-blue-600 hover:underline">Customer portal →</Link>
          <Link href="/check" className="text-sm text-blue-600 hover:underline">Check a company →</Link>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Ultratech OS</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-3">
          <StatCard label="Active work items" value={stats.activeWorkItems} />
        </div>
        <div className="flex gap-4 flex-wrap">
          <Link href="/os" className="text-sm text-blue-600 hover:underline">OS dashboard →</Link>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Builder Big Jobs</h2>
        <div className="flex gap-4 flex-wrap">
          <Link href="/intake/accuracy" className="text-sm text-blue-600 hover:underline">Public intake →</Link>
          <Link href="/os/leads/builder-big-jobs" className="text-sm text-blue-600 hover:underline">Leads dashboard →</Link>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Intake</h2>
        <div className="flex gap-4 flex-wrap">
          <Link href="/intake" className="text-sm text-blue-600 hover:underline">UltAi intake →</Link>
          <Link href="/intake/fineguard" className="text-sm text-blue-600 hover:underline">FineGuard intake →</Link>
          <Link href="/intake/accuracy" className="text-sm text-blue-600 hover:underline">Builder Big Jobs intake →</Link>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}
