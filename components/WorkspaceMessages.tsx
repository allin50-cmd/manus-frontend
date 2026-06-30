import { getDb } from '@/lib/db'
import { osMessageThreads, workItems } from '@/db/schema'
import { inArray, eq } from 'drizzle-orm'
import Link from 'next/link'

export default async function WorkspaceMessages({ companyName }: { companyName: string }) {
  const db = await getDb()

  const relatedWorkItems = await db
    .select({ id: workItems.id })
    .from(workItems)
    .where(eq(workItems.company, companyName))

  if (relatedWorkItems.length === 0) {
    return <div className="text-xs text-slate-500">No related messages</div>
  }

  const workItemIds = relatedWorkItems.map(w => w.id)

  const threads = await db
    .select()
    .from(osMessageThreads)
    .where(inArray(osMessageThreads.linkedWorkItemId, workItemIds))
    .limit(10)

  if (threads.length === 0) {
    return <div className="text-xs text-slate-500">No related messages</div>
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => (
        <Link
          key={thread.id}
          href={`/os/messages/${thread.id}`}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
            style={{
              background: 'rgba(32,175,255,0.15)',
              color: '#20AFFF',
              border: '1px solid rgba(32,175,255,0.25)',
            }}
          >
            {((thread.participantNames as string[]) || [])[0]?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
          </div>
          <p className="text-xs font-semibold flex-1 truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
            {thread.subject}
          </p>
          {thread.unreadCount > 0 && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 text-white"
              style={{ background: '#20AFFF' }}
            >
              {thread.unreadCount}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
