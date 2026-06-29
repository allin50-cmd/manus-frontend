import { getDb } from '@/lib/db'
import { osTasks, workItems } from '@/db/schema'
import { inArray, eq } from 'drizzle-orm'
import Link from 'next/link'

export default async function WorkspaceTasks({ companyName }: { companyName: string }) {
  const db = await getDb()

  const relatedWorkItems = await db
    .select({ id: workItems.id })
    .from(workItems)
    .where(eq(workItems.company, companyName))

  if (relatedWorkItems.length === 0) {
    return <div className="text-xs text-slate-500">No related tasks</div>
  }

  const workItemIds = relatedWorkItems.map(w => w.id)

  const tasks = await db
    .select()
    .from(osTasks)
    .where(inArray(osTasks.linkedWorkItemId, workItemIds))
    .limit(10)

  if (tasks.length === 0) {
    return <div className="text-xs text-slate-500">No related tasks</div>
  }

  const priorityColor: Record<string, string> = {
    Urgent: '#FF3B30',
    High: '#FF9F0A',
    Medium: '#3D8BFF',
    Low: 'rgba(255,255,255,0.4)',
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <Link
          key={task.id}
          href={`/os/tasks/${task.id}`}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
        >
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: priorityColor[task.priority] || 'rgba(255,255,255,0.3)' }}
          />
          <p className="text-xs font-semibold flex-1 truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {task.title}
          </p>
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
            style={{
              background: task.status === 'Done' ? 'rgba(40,199,111,0.2)' : 'rgba(61,139,255,0.2)',
              color: task.status === 'Done' ? '#28C76F' : '#3D8BFF',
            }}
          >
            {task.status}
          </span>
        </Link>
      ))}
    </div>
  )
}
