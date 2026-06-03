import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getStats() {
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)

  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const [total, overdue, dueToday, decisionNeeded, openActions, completedThisWeek] = await Promise.all([
    db.workItem.count({ where: { status: { notIn: ['Archived'] } } }),
    db.workItem.count({
      where: { dueDate: { lt: startOfToday }, status: { notIn: ['Completed', 'Archived', 'NotFit'] } },
    }),
    db.workItem.count({
      where: { dueDate: { gte: startOfToday, lte: endOfToday }, status: { notIn: ['Completed', 'Archived', 'NotFit'] } },
    }),
    db.workItem.count({ where: { decisionNeeded: true, status: { notIn: ['Completed', 'Archived'] } } }),
    db.action.count({ where: { status: 'Open' } }),
    db.workItem.count({ where: { status: 'Completed', updatedAt: { gte: startOfWeek } } }),
  ])

  return { total, overdue, dueToday, decisionNeeded, openActions, completedThisWeek }
}

async function getMyStats(person: string) {
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)

  const [open, dueToday, overdue] = await Promise.all([
    db.workItem.count({
      where: { owner: person, status: { notIn: ['Completed', 'Archived', 'NotFit', 'Paused'] } },
    }),
    db.workItem.count({
      where: {
        owner: person,
        dueDate: { gte: startOfToday, lte: endOfToday },
        status: { notIn: ['Completed', 'Archived', 'NotFit'] },
      },
    }),
    db.workItem.count({
      where: {
        owner: person,
        dueDate: { lt: startOfToday },
        status: { notIn: ['Completed', 'Archived', 'NotFit'] },
      },
    }),
  ])

  return { open, dueToday, overdue }
}

async function getPipeline() {
  const groups = await db.workItem.groupBy({
    by: ['status'],
    where: { status: { notIn: ['Archived', 'NotFit'] } },
    _count: { status: true },
  })
  const map: Record<string, number> = {}
  for (const g of groups) map[g.status] = g._count.status
  return map
}

async function getComplianceSummary() {
  const [pending, totalAlerts] = await Promise.all([
    db.alertDelivery.count({ where: { status: { in: ['Sent', 'Pending'] } } }),
    db.workItem.count({ where: { type: 'ComplianceAlert', status: { notIn: ['Archived'] } } }),
  ])
  return { pending, totalAlerts }
}

async function getTeamPulse() {
  const owners = ['Dagon', 'Alissa', 'Michelle', 'Chris', 'Charlie', 'George']
  const counts = await Promise.all(
    owners.map((o) =>
      db.workItem.count({
        where: { owner: o, status: { notIn: ['Archived', 'Completed', 'NotFit'] } },
      })
    )
  )
  return owners.map((owner, i) => ({ owner, count: counts[i] }))
}

function formatDayDate(date: Date): string {
  return date
    .toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
}

export default async function DashboardPage() {
  const session = await requireAuth()
  const isNamed = session.person !== 'user'

  const [stats, pipeline, teamPulse, myStats, compliance] = await Promise.all([
    getStats(),
    getPipeline(),
    getTeamPulse(),
    isNamed ? getMyStats(session.person) : Promise.resolve(null),
    getComplianceSummary(),
  ])

  const today = formatDayDate(new Date())
  const urgentCount = stats.overdue + stats.dueToday
  const urgencyText = [
    stats.overdue > 0 ? `${stats.overdue} overdue` : '',
    stats.dueToday > 0 ? `${stats.dueToday} due today` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  const pipelineSteps = [
    { key: 'Captured', label: 'Captured', bg: 'bg-slate-50 border-slate-200 text-slate-700' },
    { key: 'InProgress', label: 'In Progress', bg: 'bg-blue-50 border-blue-200 text-blue-700' },
    { key: 'Waiting', label: 'Waiting', bg: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
    { key: 'Escalated', label: 'Escalated', bg: 'bg-purple-50 border-purple-200 text-purple-700' },
    { key: 'Completed', label: 'Completed', bg: 'bg-green-50 border-green-200 text-green-700' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{today}</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {isNamed ? `Welcome back, ${session.person}` : 'Welcome back'}
        </p>
      </div>

      {urgentCount > 0 && (
        <Link
          href="/today"
          className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-3 transition-colors"
        >
          <span className="text-xl shrink-0">🔴</span>
          <div className="flex-1">
            <p className="text-sm font-semibold">{urgencyText}</p>
            <p className="text-xs opacity-80">Tap to see Today&apos;s Actions</p>
          </div>
          <span className="opacity-70 text-lg shrink-0">→</span>
        </Link>
      )}

      {/* Your Work — personalised */}
      {isNamed && myStats && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Your Work — {session.person}
            </h2>
            <Link href={`/work-items?owner=${session.person}`} className="text-xs text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Link
              href={`/work-items?owner=${session.person}`}
              className="rounded-xl border border-blue-200 bg-blue-50 p-4 block"
            >
              <div className="text-2xl font-bold text-blue-700">{myStats.open}</div>
              <div className="text-xs font-medium text-blue-700/80 mt-1">Active</div>
            </Link>
            <Link
              href="/today"
              className={`rounded-xl border p-4 block ${
                myStats.dueToday > 0
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className={`text-2xl font-bold ${myStats.dueToday > 0 ? 'text-orange-700' : 'text-slate-500'}`}>
                {myStats.dueToday}
              </div>
              <div className={`text-xs font-medium mt-1 ${myStats.dueToday > 0 ? 'text-orange-700/80' : 'text-slate-500'}`}>
                Due today
              </div>
            </Link>
            <Link
              href="/today"
              className={`rounded-xl border p-4 block ${
                myStats.overdue > 0
                  ? 'border-red-200 bg-red-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className={`text-2xl font-bold ${myStats.overdue > 0 ? 'text-red-700' : 'text-slate-500'}`}>
                {myStats.overdue}
              </div>
              <div className={`text-xs font-medium mt-1 ${myStats.overdue > 0 ? 'text-red-700/80' : 'text-slate-500'}`}>
                Overdue
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Company stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Items" value={stats.total} color="blue" />
        <StatCard label="Due / Overdue" value={urgentCount} color={urgentCount > 0 ? 'orange' : 'green'} />
        <StatCard label="Decision Needed" value={stats.decisionNeeded} color={stats.decisionNeeded > 0 ? 'purple' : 'green'} />
        <StatCard label="Open Actions" value={stats.openActions} color={stats.openActions > 0 ? 'yellow' : 'green'} />
      </div>
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Done this week</span>
        <span className="text-3xl font-bold text-green-700">{stats.completedThisWeek}</span>
      </div>

      {/* Compliance alerts widget */}
      {compliance.totalAlerts > 0 && (
        <Link
          href="/alerts"
          className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors hover:opacity-90 ${
            compliance.pending > 0
              ? 'bg-orange-50 border-orange-200'
              : 'bg-green-50 border-green-200'
          }`}
        >
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${compliance.pending > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              Compliance Alerts
            </p>
            <p className={`text-sm font-medium mt-0.5 ${compliance.pending > 0 ? 'text-orange-800' : 'text-green-800'}`}>
              {compliance.pending > 0
                ? `${compliance.pending} awaiting acknowledgement`
                : 'All acknowledged'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-2xl font-bold ${compliance.pending > 0 ? 'text-orange-700' : 'text-green-700'}`}>
              {compliance.totalAlerts}
            </div>
            <div className="text-xs text-slate-500">active alerts</div>
          </div>
        </Link>
      )}

      {/* Company pipeline */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Company Pipeline</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {pipelineSteps.map(({ key, label, bg }) => (
            <Link
              key={key}
              href={`/work-items?status=${key}`}
              className={`flex-shrink-0 rounded-xl border px-3 py-3 text-center min-w-[76px] transition-opacity hover:opacity-80 ${bg}`}
            >
              <div className="text-xl font-bold">{pipeline[key] ?? 0}</div>
              <div className="text-xs mt-0.5 font-medium">{label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Team pulse */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Team Pulse</h2>
          <Link href="/teams" className="text-xs text-blue-600 hover:underline">
            Full team view →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {teamPulse.map(({ owner, count }) => (
            <Link
              key={owner}
              href={`/work-items?owner=${owner}`}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-800">{owner}</span>
              <span
                className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                  count > 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {count}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Big action buttons */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BigButton href="/work-items/new" label="+ Add Work Item" color="blue" />
        <BigButton href="/today" label="Today's Actions" color="orange" />
        <BigButton href="/decisions" label="Decision Queue" color="purple" />
        <BigButton href="/teams" label="Teams" color="slate" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <BigButton href="/work-items" label="All Work Items" color="slate" />
        <BigButton href="/activity" label="Activity Log" color="slate" />
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    slate: 'bg-slate-100 border-slate-200 text-slate-700',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color] ?? colors.slate}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs font-medium mt-1 opacity-80">{label}</div>
    </div>
  )
}

function BigButton({ href, label, color }: { href: string; label: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    orange: 'bg-orange-500 hover:bg-orange-600 text-white',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white',
    slate: 'bg-slate-200 hover:bg-slate-300 text-slate-800',
  }
  return (
    <Link
      href={href}
      className={`block rounded-xl px-4 py-4 text-center font-semibold text-sm transition-colors ${colors[color] ?? colors.slate}`}
    >
      {label}
    </Link>
  )
}
