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
      where: {
        dueDate: { lt: startOfToday },
        status: { notIn: ['Completed', 'Archived', 'NotFit'] },
      },
    }),
    db.workItem.count({
      where: {
        dueDate: { gte: startOfToday, lte: endOfToday },
        status: { notIn: ['Completed', 'Archived', 'NotFit'] },
      },
    }),
    db.workItem.count({ where: { decisionNeeded: true, status: { notIn: ['Completed', 'Archived'] } } }),
    db.action.count({ where: { status: 'Open' } }),
    db.workItem.count({
      where: {
        status: 'Completed',
        updatedAt: { gte: startOfWeek },
      },
    }),
  ])

  return { total, overdue, dueToday, decisionNeeded, openActions, completedThisWeek }
}

function formatDayDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
}

export default async function DashboardPage() {
  const session = await requireAuth()
  const stats = await getStats()
  const today = formatDayDate(new Date())

  const urgentCount = stats.overdue + stats.dueToday
  const urgencyText = [
    stats.overdue > 0 ? `${stats.overdue} overdue` : '',
    stats.dueToday > 0 ? `${stats.dueToday} due today` : '',
  ].filter(Boolean).join(' · ')

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{today}</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Welcome back, {session.person}</p>
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

      {/* Stats grid — 2×2 + slim banner avoids an orphan card on mobile */}
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

      {/* Big action buttons */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BigButton href="/work-items/new" label="+ Add Work Item" color="blue" />
        <BigButton href="/today" label="Today's Actions" color="orange" />
        <BigButton href="/decisions" label="Decision Queue" color="purple" />
        <BigButton href="/activity" label="Activity Log" color="slate" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <BigButton href="/work-items" label="All Work Items" color="slate" />
        <BigButton href="/templates" label="Templates" color="slate" />
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
