import { getDb } from '@/lib/db'
import { osDocuments } from '@/db/schema'
import { desc, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

function fmtBytes(b: number) {
  if (b > 1_048_576) return `${(b / 1_048_576).toFixed(1)} MB`
  if (b > 1024) return `${Math.round(b / 1024)} KB`
  return `${b} B`
}

function timeLabel(d: Date) {
  const diff = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  PendingReview: { bg: 'rgba(255,159,10,0.15)', text: '#FF9F0A', border: 'rgba(255,159,10,0.25)' },
  Approved: { bg: 'rgba(40,199,111,0.15)', text: '#28C76F', border: 'rgba(40,199,111,0.25)' },
  Rejected: { bg: 'rgba(255,59,48,0.15)', text: '#FF3B30', border: 'rgba(255,59,48,0.25)' },
  Archived: { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)' },
}

const DocIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} style={{ color: 'rgba(255,255,255,0.4)' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
  </svg>
)

const SECTIONS = [
  { label: 'Contracts', color: '#818CF8' },
  { label: 'Invoices', color: '#FFC145' },
  { label: 'Certificates', color: '#28C76F' },
  { label: 'Photos', color: '#20AFFF' },
  { label: 'Archive', color: 'rgba(255,255,255,0.35)' },
]

export default async function DocumentsPage() {
  const db = await getDb()

  const [docs, agg] = await Promise.all([
    db.select().from(osDocuments).orderBy(desc(osDocuments.createdAt)).limit(20),
    db.select({
      total: sql<number>`count(*)`,
      pendingReview: sql<number>`count(*) filter (where status = 'PendingReview')`,
      approved: sql<number>`count(*) filter (where status = 'Approved')`,
      totalSizeBytes: sql<number>`coalesce(sum(file_size_bytes), 0)`,
    }).from(osDocuments),
  ])

  const s = agg[0] ?? { total: 0, pendingReview: 0, approved: 0, totalSizeBytes: 0 }
  const totalDocs = Number(s.total)
  const pendingCount = Number(s.pendingReview)
  const approvedCount = Number(s.approved)
  const storageStr = fmtBytes(Number(s.totalSizeBytes))

  const stats = [
    { label: 'Total Files', value: String(totalDocs), urgent: false },
    { label: 'Pending Review', value: String(pendingCount), urgent: pendingCount > 0 },
    { label: 'Storage', value: storageStr, urgent: false },
  ]

  const sectionsWithCounts = [
    { label: 'Contracts', count: 0, color: '#818CF8' },
    { label: 'Invoices', count: approvedCount, color: '#FFC145' },
    { label: 'Certificates', count: 0, color: '#28C76F' },
    { label: 'Photos', count: 0, color: '#20AFFF' },
    { label: 'Archive', count: 0, color: 'rgba(255,255,255,0.35)' },
  ]

  const listDocs = docs.slice(0, 15)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Module icon */}
          <div
            className="relative w-[56px] h-[56px] rounded-[18px] overflow-hidden flex items-center justify-center shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 20%, #D0D4FF 0%, #818CF8 50%, #2C2CA8 100%)',
              boxShadow: '0 12px 32px -6px rgba(129,140,248,0.55), inset 0 1.5px 0 rgba(255,255,255,0.45)',
            }}
          >
            <div
              className="absolute inset-x-0 top-0"
              style={{ height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)', borderRadius: '18px 18px 0 0' }}
            />
            <svg className="relative z-20 w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Documents</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{totalDocs} files · {pendingCount} pending review</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #818CF8, #4338CA)' }}
          >
            Upload
          </button>
          <button
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.7)' }}
          >
            Request Doc
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((st) => (
          <div
            key={st.label}
            className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <div
              className="font-bold text-2xl"
              style={{ color: st.urgent ? '#FF9F0A' : 'rgba(255,255,255,0.92)' }}
            >
              {st.value}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Sub-sections */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>CATEGORIES</p>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {sectionsWithCounts.map((sec, i) => (
            <div
              key={sec.label}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer"
              style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: sec.color }}
              />
              <div className="flex-1 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.82)' }}>{sec.label}</div>
              <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.38)' }}>{sec.count}</div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Document list */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>RECENT FILES</p>
        {listDocs.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center text-sm"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}
          >
            No documents yet
          </div>
        ) : (
          <div className="space-y-2">
            {listDocs.map((doc) => {
              const sc = STATUS_COLOR[doc.status] ?? STATUS_COLOR.Archived
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="shrink-0">
                    <DocIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>{doc.filename}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {doc.source} · Uploaded by {doc.uploadedBy}
                    </div>
                  </div>
                  <div className="text-[11px] shrink-0 mr-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {doc.fileSizeBytes ? fmtBytes(doc.fileSizeBytes) : '—'}
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                  >
                    {doc.status === 'PendingReview' ? 'Review' : doc.status}
                  </span>
                  <div className="text-[10px] shrink-0 ml-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    {timeLabel(new Date(doc.createdAt))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
