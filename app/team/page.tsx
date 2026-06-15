import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const PERSONS = ['George', 'Dagon', 'Alissa', 'Michelle', 'Chris', 'Charlie'] as const

export default async function TeamCapacityPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const now = new Date()
  const todayStr = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  let openActions: { assignedTo: string | null; status: string; dueDate: Date | null }[]
  try {
    openActions = await db.action.findMany({
      where: {
        assignedTo: { in: [...PERSONS] },
        status: { in: ['Open', 'Blocked'] },
      },
      select: {
        assignedTo: true,
        status: true,
        dueDate: true,
      },
    })
  } catch {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Team Capacity</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-sm text-red-700">
          Could not load team data. Please refresh the page.
        </div>
      </div>
    )
  }

  const capacity = PERSONS.map((name) => {
    const mine = openActions.filter((a) => a.assignedTo === name)
    const openTasks = mine.filter((a) => a.status === 'Open').length
    const blockedTasks = mine.filter((a) => a.status === 'Blocked').length
    const overdueTasks = mine.filter((a) => a.dueDate !== null && a.dueDate < now).length
    return { name, openTasks, blockedTasks, overdueTasks }
  })

  const totalOpen = capacity.reduce((sum, p) => sum + p.openTasks, 0)
  const totalBlocked = capacity.reduce((sum, p) => sum + p.blockedTasks, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Team Capacity</h1>
        <p className="text-sm text-slate-500 mt-0.5">as of {todayStr}</p>
      </div>

      {/* Summary strip */}
      <div className="flex gap-3 flex-wrap">
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex-1 min-w-[100px]">
          <div className="text-2xl font-bold text-slate-900">{totalOpen}</div>
          <div className="text-xs text-slate-500 mt-0.5">Open tasks</div>
        </div>
        <div className={`border rounded-xl px-4 py-3 flex-1 min-w-[100px] ${totalBlocked > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`text-2xl font-bold ${totalBlocked > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{totalBlocked}</div>
          <div className="text-xs text-slate-500 mt-0.5">Blocked</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex-1 min-w-[100px]">
          <div className="text-2xl font-bold text-slate-900">{PERSONS.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Team members</div>
        </div>
      </div>

      {/* Person cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {capacity.map((person) => (
          <Link
            key={person.name}
            href={`/my-tasks?person=${encodeURIComponent(person.name)}`}
            className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900 text-base">{person.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">View tasks →</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-slate-900">{person.openTasks + person.blockedTasks}</div>
                <div className="text-xs text-slate-500">total open</div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <div className="flex-1 bg-blue-50 rounded-lg px-3 py-2 text-center">
                <div className="text-lg font-bold text-blue-700">{person.openTasks}</div>
                <div className="text-xs text-blue-500">Open</div>
              </div>
              <div className={`flex-1 rounded-lg px-3 py-2 text-center ${person.blockedTasks > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                <div className={`text-lg font-bold ${person.blockedTasks > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                  {person.blockedTasks}
                </div>
                <div className={`text-xs ${person.blockedTasks > 0 ? 'text-amber-500' : 'text-slate-400'}`}>Blocked</div>
              </div>
              <div className={`flex-1 rounded-lg px-3 py-2 text-center ${person.overdueTasks > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                <div className={`text-lg font-bold ${person.overdueTasks > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                  {person.overdueTasks}
                </div>
                <div className={`text-xs ${person.overdueTasks > 0 ? 'text-red-400' : 'text-slate-400'}`}>Overdue</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
