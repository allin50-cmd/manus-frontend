import { requireAuth } from '../../lib/auth'
import { db } from '../../lib/db'
import Link from 'next/link'
import StatusBadge from '../../components/StatusBadge'

export const dynamic = 'force-dynamic'

const TEAMS = [
  {
    name: 'Sales & BD',
    owners: ['Dagon', 'Alissa'],
    description: 'Partnerships, pipeline & client relationships',
    color: 'orange',
  },
  {
    name: 'Operations',
    owners: ['Michelle'],
    description: 'Delivery, process & compliance',
    color: 'emerald',
  },
  {
    name: 'Tech',
    owners: ['Chris', 'Charlie'],
    description: 'Product, engineering & infrastructure',
    color: 'blue',
  },
  {
    name: 'Leadership',
    owners: ['George'],
    description: 'Decisions, strategy & oversight',
    color: 'purple',
  },
]

const COLORS: Record<string, { header: string; border: string; bg: string; badge: string; link: string }> = {
  orange: {
    header: 'text-orange-800',
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    badge: 'bg-orange-100 text-orange-700',
    link: 'text-orange-700 hover:text-orange-900',
  },
  emerald: {
    header: 'text-emerald-800',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700',
    link: 'text-emerald-700 hover:text-emerald-900',
  },
  blue: {
    header: 'text-blue-800',
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    link: 'text-blue-700 hover:text-blue-900',
  },
  purple: {
    header: 'text-purple-800',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    badge: 'bg-purple-100 text-purple-700',
    link: 'text-purple-700 hover:text-purple-900',
  },
}

async function fetchTeamData(owners: string[]) {
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const [activeCount, openActionsCount, overdueCount, recentItems, doneThisWeek] = await Promise.all([
    db.workItem.count({
      where: { owner: { in: owners }, status: { notIn: ['Archived', 'NotFit', 'Completed'] } },
    }),
    db.action.count({
      where: { status: 'Open', workItem: { owner: { in: owners } } },
    }),
    db.workItem.count({
      where: {
        owner: { in: owners },
        dueDate: { lt: new Date() },
        status: { notIn: ['Completed', 'Archived', 'NotFit'] },
      },
    }),
    db.workItem.findMany({
      where: { owner: { in: owners }, status: { notIn: ['Archived', 'NotFit'] } },
      orderBy: { updatedAt: 'desc' },
      take: 4,
      select: {
        id: true,
        title: true,
        status: true,
        owner: true,
        priority: true,
        nextAction: true,
        company: true,
      },
    }),
    db.workItem.count({
      where: { owner: { in: owners }, status: 'Completed', updatedAt: { gte: startOfWeek } },
    }),
  ])

  return { activeCount, openActionsCount, overdueCount, recentItems, doneThisWeek }
}

export default async function TeamsPage() {
  await requireAuth()

  const teamData = await Promise.all(TEAMS.map((t) => fetchTeamData(t.owners)))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Teams</h1>
        <p className="text-sm text-slate-500 mt-0.5">Live work status across every team</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TEAMS.map((team, i) => {
          const data = teamData[i]
          const c = COLORS[team.color]
          const singleOwner = team.owners.length === 1 ? team.owners[0] : null

          return (
            <div key={team.name} className={`rounded-xl border ${c.border} ${c.bg} p-5 space-y-4`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className={`font-bold text-lg ${c.header}`}>{team.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{team.owners.join(' · ')}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{team.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-3xl font-bold ${c.header}`}>{data.activeCount}</div>
                  <div className="text-xs text-slate-500">active</div>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`px-2 py-1 rounded-md font-medium ${c.badge}`}>
                  {data.openActionsCount} open action{data.openActionsCount !== 1 ? 's' : ''}
                </span>
                {data.overdueCount > 0 && (
                  <span className="px-2 py-1 rounded-md font-medium bg-red-100 text-red-700">
                    {data.overdueCount} overdue
                  </span>
                )}
                <span className="px-2 py-1 rounded-md font-medium bg-green-100 text-green-700">
                  {data.doneThisWeek} done this week
                </span>
              </div>

              {/* Recent items */}
              {data.recentItems.length > 0 ? (
                <div className="space-y-1.5">
                  {data.recentItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/work-items/${item.id}`}
                      className="flex items-start gap-2 bg-white/80 hover:bg-white rounded-lg px-3 py-2 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                        {item.company && (
                          <p className="text-xs text-slate-500 truncate">{item.company}</p>
                        )}
                        {item.nextAction && !item.company && (
                          <p className="text-xs text-slate-400 truncate">{item.nextAction}</p>
                        )}
                      </div>
                      <div className="shrink-0 mt-0.5">
                        <StatusBadge status={item.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No active items yet</p>
              )}

              {/* Footer links */}
              <div className="flex gap-4 text-xs font-semibold pt-1">
                {singleOwner ? (
                  <Link href={`/work-items?owner=${singleOwner}`} className={c.link}>
                    All {team.name} items →
                  </Link>
                ) : (
                  team.owners.map((o) => (
                    <Link key={o} href={`/work-items?owner=${o}`} className={c.link}>
                      {o}&apos;s items →
                    </Link>
                  ))
                )}
                {team.name === 'Leadership' && (
                  <Link href="/decisions" className={c.link}>
                    Decision Queue →
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
