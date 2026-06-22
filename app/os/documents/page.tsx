import { getDb } from '@/lib/db'
import { osDocuments } from '@/db/schema'
import { desc, sql, eq } from 'drizzle-orm'

function fileSize(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1_048_576).toFixed(1)}MB`
}

function timeLabel(d: Date) {
  const diff = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

const STATUS_STYLE: Record<string, string> = {
  PendingReview: 'bg-amber-50 text-amber-700 border border-amber-200',
  Approved: 'bg-green-50 text-green-700 border border-green-200',
  Rejected: 'bg-red-50 text-red-700 border border-red-200',
  Archived: 'bg-slate-100 text-slate-500',
}

const MIME_ICON: Record<string, string> = {
  'application/pdf': '📄',
  'image/png': '🖼',
  'image/jpeg': '🖼',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
}

export const dynamic = 'force-dynamic'

export default async function DocumentsPage() {
  const db = await getDb()

  const [docs, agg] = await Promise.all([
    db.select().from(osDocuments).orderBy(desc(osDocuments.createdAt)).limit(30),
    db
      .select({
        pending: sql<number>`count(*) filter (where status = 'PendingReview')`,
        approved: sql<number>`count(*) filter (where status = 'Approved')`,
        total: sql<number>`count(*)`,
      })
      .from(osDocuments),
  ])

  const s = agg[0] ?? { pending: 0, approved: 0, total: 0 }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #A5B4FC, #6366F1)' }}
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-500 text-sm">{Number(s.total)} files · {Number(s.pending)} pending review</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: String(s.total) },
          { label: 'Needs Review', value: String(s.pending), urgent: Number(s.pending) > 0 },
          { label: 'Approved', value: String(s.approved) },
        ].map((st) => (
          <div key={st.label} className="bg-white rounded-xl border border-slate-100 p-4 text-center">
            <div className={`text-3xl font-bold ${st.urgent ? 'text-amber-600' : 'text-slate-800'}`}>{st.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{st.label}</div>
          </div>
        ))}
      </div>

      {docs.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
          No documents yet
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">All Documents</h2>
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100"
              >
                <div className="text-2xl shrink-0">{MIME_ICON[doc.mimeType ?? ''] ?? '📎'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm truncate">{doc.filename}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {fileSize(doc.fileSizeBytes)} · {doc.uploadedBy} · {timeLabel(new Date(doc.createdAt))}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[doc.status] ?? 'bg-slate-100 text-slate-500'}`}>
                  {doc.status === 'PendingReview' ? 'Review' : doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
