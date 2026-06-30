import { getDb } from '@/lib/db'
import { osCallLogs, workItems } from '@/db/schema'
import { inArray, eq } from 'drizzle-orm'
import Link from 'next/link'

export default async function WorkspaceCalls({ companyName }: { companyName: string }) {
  const db = await getDb()

  const relatedWorkItems = await db
    .select({ id: workItems.id })
    .from(workItems)
    .where(eq(workItems.company, companyName))

  if (relatedWorkItems.length === 0) {
    return <div className="text-xs text-slate-500">No related calls</div>
  }

  const workItemIds = relatedWorkItems.map(w => w.id)

  const calls = await db
    .select()
    .from(osCallLogs)
    .where(inArray(osCallLogs.linkedWorkItemId, workItemIds))
    .limit(10)

  if (calls.length === 0) {
    return <div className="text-xs text-slate-500">No related calls</div>
  }

  return (
    <div className="space-y-2">
      {calls.map((call) => (
        <Link
          key={call.id}
          href={`/os/calls/${call.id}`}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
            style={{
              background: call.direction === 'Inbound' ? 'rgba(40,199,111,0.15)' : 'rgba(32,175,255,0.15)',
              color: call.direction === 'Inbound' ? '#28C76F' : '#20AFFF',
              border: call.direction === 'Inbound' ? '1px solid rgba(40,199,111,0.25)' : '1px solid rgba(32,175,255,0.25)',
            }}
          >
            {call.direction === 'Inbound' ? '↙' : '↗'}
          </div>
          <p className="text-xs font-semibold flex-1 truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {call.callerName}
          </p>
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
            style={{
              background: call.outcome === 'Answered' ? 'rgba(40,199,111,0.2)' : 'rgba(255,59,48,0.2)',
              color: call.outcome === 'Answered' ? '#28C76F' : '#FF3B30',
            }}
          >
            {call.outcome}
          </span>
        </Link>
      ))}
    </div>
  )
}
