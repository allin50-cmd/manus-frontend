import { getDb } from '@/lib/db'
import { osDocuments, workItems } from '@/db/schema'
import { inArray, eq } from 'drizzle-orm'
import Link from 'next/link'

export default async function WorkspaceDocuments({ companyName }: { companyName: string }) {
  const db = await getDb()

  const relatedWorkItems = await db
    .select({ id: workItems.id })
    .from(workItems)
    .where(eq(workItems.company, companyName))

  const workItemIds = relatedWorkItems.map(w => w.id)

  const docs = await db
    .select()
    .from(osDocuments)
    .where(inArray(osDocuments.linkedWorkItemId, workItemIds.length > 0 ? workItemIds : ['']))
    .limit(10)

  if (docs.length === 0) {
    return <div className="text-xs text-slate-500">No related documents</div>
  }

  const statusColor: Record<string, { bg: string; text: string }> = {
    PendingReview: { bg: 'rgba(255,159,10,0.2)', text: '#FF9F0A' },
    Approved: { bg: 'rgba(40,199,111,0.2)', text: '#28C76F' },
    Rejected: { bg: 'rgba(255,59,48,0.2)', text: '#FF3B30' },
    Archived: { bg: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.4)' },
  }

  return (
    <div className="space-y-2">
      {docs.map((doc) => {
        const colors = statusColor[doc.status] || statusColor.Archived
        return (
          <Link
            key={doc.id}
            href={`/os/documents/${doc.id}`}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <p className="text-xs font-semibold flex-1 truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {doc.filename}
            </p>
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: colors.bg, color: colors.text }}
            >
              {doc.status === 'PendingReview' ? 'Review' : doc.status}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
