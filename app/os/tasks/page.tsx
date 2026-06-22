import { getDb } from '@/lib/db'
import { osTasks } from '@/db/schema'
import { desc, sql, eq, or } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

function priorityStyle(priority: string | null) {
  switch (priority) {
    case 'Urgent':
      return { bg: 'rgba(255,59,48,0.15)', color: '#FF3B30', dot: '#FF3B30' }
    case 'High':
      return { bg: 'rgba(255,159,10,0.15)', color: '#FF9F0A', dot: '#FF9F0A' }
    case 'Medium':
      return { bg: 'rgba(61,139,255,0.15)', color: '#3D8BFF', dot: '#3D8BFF' }
    default:
      return { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', dot: 'rgba(255,255,255,0.25)' }
  }
}

function statusStyle(status: string | null) {
  switch (status) {
    case 'InProgress':
      return { bg: 'rgba(40,199,111,0.15)', color: '#28C76F' }
    case 'Done':
      return { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
    case 'Cancelled':
      return { bg: 'rgba(255,59,48,0.10)', color: '#FF3B30' }
    default:
      return { bg: 'rgba(61,139,255,0.12)', color: '#3D8BFF' }
  }
}

function statusLabel(status: string | null): string {
  if (status === 'InProgress') return 'In Progress'
  return status ?? 'Open'
}

function dueDateLabel(d: Date, now: Date): string {
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMs < 0) {
    const overdueDays = Math.ceil(Math.abs(diffMs) / 86_400_000)
    return `${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`
  }
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `Due ${d.getDate()} ${months[d.getMonth()]}`
}

export default async function TasksPage() {
  const db = await getDb()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 86_400_000)

  const [tasks, agg] = await Promise.all([
    db
      .select()
      .from(osTasks)
      .where(or(eq(osTasks.status, 'Open'), eq(osTasks.status, 'InProgress')))
      .orderBy(desc(osTasks.createdAt))
      .limit(20),
    db
      .select({
        total: sql<number>`count(*) filter (where status not in ('Done','Cancelled'))`,
        today: sql<number>`count(*) filter (where due_at >= ${todayStart.toISOString()} and due_at < ${todayEnd.toISOString()} and status not in ('Done','Cancelled'))`,
        overdue: sql<number>`count(*) filter (where due_at < ${now.toISOString()} and status not in ('Done','Cancelled'))`,
        done: sql<number>`count(*) filter (where status = 'Done')`,
        inProgress: sql<number>`count(*) filter (where status = 'InProgress')`,
      })
      .from(osTasks),
  ])

  const s = agg[0] ?? { total: 0, today: 0, overdue: 0, done: 0, inProgress: 0 }

  const stats = [
    { label: 'Total Open', value: Number(s.total), urgent: false },
    { label: 'Due Today', value: Number(s.today), urgent: false },
    { label: 'In Progress', value: Number(s.inProgress), urgent: false },
    { label: 'Overdue', value: Number(s.overdue), urgent: Number(s.overdue) > 0 },
  ]

  const sections = [
    { label: 'Today', count: Number(s.today), color: '#3D8BFF' },
    { label: 'In Progress', count: Number(s.inProgress), color: '#28C76F' },
    { label: 'All Open', count: Number(s.total), color: '#818CF8' },
    { label: 'Completed', count: Number(s.done), color: 'rgba(255,255,255,0.4)' },
    { label: 'Overdue', count: Number(s.overdue), color: '#FF3B30' },
  ]

  const displayTasks = tasks.slice(0, 15)

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Module Header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="relative w-[60px] h-[60px] rounded-[20px] shrink-0 overflow-hidden flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 30% 20%, #A0C8FF 0%, #3D8BFF 50%, #002880 100%)',
            boxShadow:
              '0 16px 40px -8px rgba(61,139,255,0.55), 0 4px 14px -2px rgba(0,0,0,0.6), inset 0 1.5px 0 rgba(255,255,255,0.45)',
          }}
        >
          <div
            className="absolute inset-x-0 top-0 pointer-events-none z-10"
            style={{
              height: '55%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)',
              borderRadius: '20px 20px 0 0',
            }}
          />
          <svg
            className="relative z-20 w-7 h-7 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Tasks
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Actions, to-dos &amp; follow-ups
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.055)',
              border: '1px solid rgba(255,255,255,0.09)',
            }}
          >
            <div
              className="text-2xl font-bold"
              style={{ color: stat.urgent ? '#FF3B30' : 'rgba(255,255,255,0.92)' }}
            >
              {stat.value}
            </div>
            <div className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Sub-sections */}
      <div
        className="rounded-2xl overflow-hidden mb-6"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {sections.map((section, i) => (
          <div
            key={section.label}
            className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
            style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
          >
            <span className="flex-1 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {section.label}
            </span>
            {section.count > 0 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${section.color}20`, color: section.color }}
              >
                {section.count}
              </span>
            )}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="2.5"
            >
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>

      {/* Task List */}
      <div
        className="rounded-2xl overflow-hidden mb-6"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.32)' }}
          >
            Open Tasks
          </span>
        </div>

        {displayTasks.length === 0 && (
          <div className="px-4 py-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.32)' }}>
            No open tasks
          </div>
        )}

        {displayTasks.map((task, i) => {
          const pri = priorityStyle(task.priority)
          const stat = statusStyle(task.status)
          const dueAt = task.dueAt ? new Date(task.dueAt) : null
          const isOverdue = dueAt ? dueAt.getTime() < now.getTime() : false
          const dueLabelText = dueAt ? dueDateLabel(dueAt, now) : null

          return (
            <div
              key={task.id}
              className="flex items-start gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
              style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
            >
              {/* Priority dot */}
              <div
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ background: pri.dot }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: 'rgba(255,255,255,0.92)' }}
                  >
                    {task.title}
                  </span>
                  {/* Priority chip */}
                  {task.priority && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: pri.bg, color: pri.color }}
                    >
                      {task.priority}
                    </span>
                  )}
                  {/* Status badge */}
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: stat.bg, color: stat.color }}
                  >
                    {statusLabel(task.status)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {task.assignedTo && (
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {task.assignedTo}
                    </span>
                  )}
                  {dueLabelText && (
                    <>
                      {task.assignedTo && (
                        <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                      )}
                      <span
                        className="text-xs font-medium"
                        style={{ color: isOverdue ? '#FF3B30' : 'rgba(255,255,255,0.45)' }}
                      >
                        {dueLabelText}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2.5"
                className="shrink-0 mt-1"
              >
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #3D8BFF, #1A4FCC)', color: 'white' }}
        >
          Add Task
        </button>
        <button
          className="px-5 py-3 rounded-xl text-sm font-medium"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.09)',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          View All
        </button>
      </div>
    </div>
  )
}
