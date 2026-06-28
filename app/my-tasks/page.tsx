import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import type { ActionStatus } from '@/lib/types'
import MyTasksClient from './MyTasksClient'

export const dynamic = 'force-dynamic'

interface SearchParams {
  person?: string
  status?: string
}

const VALID_STATUSES: ActionStatus[] = ['Open', 'Blocked', 'Done', 'Cancelled']

export default async function MyTasksPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const viewingPerson = searchParams.person ?? session.person

  const statusParam = searchParams.status ?? 'Open,Blocked'
  let statuses: ActionStatus[]
  if (statusParam === 'all') {
    statuses = VALID_STATUSES
  } else {
    const requested = statusParam.split(',').map((s) => s.trim()) as ActionStatus[]
    statuses = requested.filter((s) => VALID_STATUSES.includes(s))
    if (statuses.length === 0) statuses = ['Open', 'Blocked']
  }

  let tasks: {
    id: string
    label: string
    status: ActionStatus
    dueDate: Date | null
    assignedTo: string | null
    workItemId: string
    workItem: {
      id: string
      title: string
      company: string | null
      status: string
      priority: string
    }
  }[]

  try {
    tasks = await db.action.findMany({
      where: {
        assignedTo: viewingPerson,
        status: { in: statuses },
      },
      include: {
        workItem: {
          select: {
            id: true,
            title: true,
            company: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    })
  } catch {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-sm text-red-700">
          Could not load tasks. Please refresh the page.
        </div>
      </div>
    )
  }

  const openCount = tasks.filter((t) => t.status === 'Open' || t.status === 'Blocked').length

  const serialized = tasks.map((t) => ({
    id: t.id,
    label: t.label,
    status: t.status as string,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    assignedTo: t.assignedTo,
    workItemId: t.workItemId,
    workItem: t.workItem,
  }))

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Tasks
            {viewingPerson !== session.person && (
              <span className="ml-2 text-base font-normal text-slate-500">({viewingPerson})</span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Actions assigned to {viewingPerson === session.person ? 'you' : viewingPerson}
          </p>
        </div>
        {openCount > 0 && (
          <span className="bg-blue-600 text-white text-sm font-bold rounded-full px-3 py-1">
            {openCount}
          </span>
        )}
      </div>

      <MyTasksClient initialTasks={serialized} currentPerson={session.person} />
    </div>
  )
}
