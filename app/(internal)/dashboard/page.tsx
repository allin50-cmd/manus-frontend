import { requireAuth } from '@/lib/auth'
import { getDb, workItems, actions } from '@/lib/db'
import Link from 'next/link'
import { count, eq, notInArray, lte, gte, and } from 'drizzle-orm'

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

  const db = await getDb()

  const [totalRes, dueTodayRes, decisionNeededRes, openActionsRes, completedThisWeekRes] = await Promise.all([
    db.select({ count: count() }).from(workItems).where(
      notInArray(workItems.status, ['Archived'])
    ),
    db.select({ count: count() }).from(workItems).where(
      and(
        lte(workItems.dueDate, endOfToday),
        notInArray(workItems.status, ['Completed', 'Archived', 'NotFit'])
      )
    ),
    db.select({ count: count() }).from(workItems).where(
      and(
        eq(workItems.decisionNeeded, true),
        notInArray(workItems.status, ['Completed', 'Archived'])
      )
    ),
    db.select({ count: count() }).from(actions).where(eq(actions.status, 'Open')),
    db.select({ count: count() }).from(workItems).where(
      and(
        eq(workItems.status, 'Completed'),
        gte(workItems.updatedAt, startOfWeek)
      )
    ),
  ])

  return {
    total: Number(totalRes[0]?.count ?? 0),
    dueToday: Number(dueTodayRes[0]?.count ?? 0),
    decisionNeeded: Number(decisionNeededRes[0]?.count ?? 0),
    openActions: Number(openActionsRes[0]?.count ?? 0),
    completedThisWeek: Number(completedThisWeekRes[0]?.count ?? 0),
  }
}

export default async function DashboardPage() {
  const session = await requireAuth()
  const stats = await getStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back, {session.person}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Items" value={stats.total} color="blue" />
        <StatCard label="Due / Overdue" value={stats.dueToday} color={stats.dueToday > 0 ? 'orange' : 'green'} />
        <StatCard label="Decision Needed" value={stats.decisionNeeded} color={stats.decisionNeeded > 0 ? 'purple' : 'green'} />
        <StatCard label="Open Actions" value={stats.openActions} color={stats.openActions > 0 ? 'yellow' : 'green'} />
        <StatCard label="Done This Week" value={stats.completedThisWeek} color="green" />
      </div>

      {/* Big action buttons */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BigButton href="/work-items/new" label="+ Add Work Item" color="blue" />
        <BigButton href="/voice-intake" label="Voice Intake" color="green" />
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
    green: 'bg-green-600 hover:bg-green-700 text-white',
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
