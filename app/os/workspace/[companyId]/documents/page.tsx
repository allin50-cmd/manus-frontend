import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import { osDocuments } from '@/db/schema'
import { getCompany } from '@/lib/company-registry'
import { desc, sql, or, eq, isNull } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

function fmtBytes(b: number) {
  if (b > 1_048_576) return `${(b / 1_048_576).toFixed(1)} MB`
  if (b > 1024) return `${Math.round(b / 1024)} KB`
  return `${b} B`
}

function docTypeLabel(mimeType: string | null, filename: string): string {
  if (mimeType) {
    if (mimeType.includes('pdf'))          return 'PDF'
    if (mimeType.includes('word') || mimeType.includes('msword')) return 'Word'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel'
    if (mimeType.includes('image'))        return 'Image'
    if (mimeType.includes('text/plain'))   return 'Text'
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'Archive'
  }
  const ext = filename.split('.').pop()?.toUpperCase()
  return ext ?? 'File'
}

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  PendingReview: { bg: 'rgba(255,159,10,0.15)', text: '#FF9F0A' },
  Approved:      { bg: 'rgba(40,199,111,0.15)',  text: '#28C76F' },
  Rejected:      { bg: 'rgba(255,59,48,0.15)',   text: '#FF3B30' },
  Archived:      { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.4)' },
}

export default async function WorkspaceDocumentsPage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  const db = await getDb()

  // osDocuments.linkedCompany is free-text; include null docs as legacy/unscoped.
  // TODO: enforce strict company scoping once linkedCompany is populated consistently.
  const companyFilter = or(
    eq(osDocuments.linkedCompany, params.companyId),
    isNull(osDocuments.linkedCompany),
  )

  const [docs, agg] = await Promise.all([
    db.select().from(osDocuments).where(companyFilter).orderBy(desc(osDocuments.createdAt)).limit(20),
    db
      .select({
        total:         sql<number>`count(*)`,
        pendingReview: sql<number>`count(*) filter (where status = 'PendingReview')`,
        approved:      sql<number>`count(*) filter (where status = 'Approved')`,
        totalBytes:    sql<number>`coalesce(sum(file_size_bytes), 0)`,
      })
      .from(osDocuments)
      .where(companyFilter),
  ])

  const s = agg[0] ?? { total: 0, pendingReview: 0, approved: 0, totalBytes: 0 }
  const total = Number(s.total)
  const pending = Number(s.pendingReview)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Documents</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {total} file{total !== 1 ? 's' : ''} · {fmtBytes(Number(s.totalBytes))} used
          </p>
        </div>
        <Link
          href="/os/documents"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: 'rgba(129,140,248,0.12)', color: '#818CF8', border: '1px solid rgba(129,140,248,0.2)' }}
        >
          Upload Document
        </Link>
      </div>

      {/* Pending review banner */}
      {pending > 0 && (
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: 'rgba(255,159,10,0.07)', border: '1px solid rgba(255,159,10,0.14)' }}
        >
          <p className="text-[10px] font-bold mb-0.5" style={{ color: '#FF9F0A' }}>
            {pending} PENDING REVIEW
          </p>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {pending} document{pending !== 1 ? 's' : ''} waiting for approval
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',    value: total,                     color: '#818CF8' },
          { label: 'Approved', value: Number(s.approved),        color: '#28C76F' },
          { label: 'Pending',  value: pending,                   color: '#FF9F0A' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[10px] mt-0.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Document list */}
      {docs.length === 0 ? (
        <div
          className="rounded-2xl p-10 flex flex-col items-center text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}
        >
          <span className="text-3xl mb-3" aria-hidden>📄</span>
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>No documents yet.</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Uploaded contracts, filings, reports, and evidence packs will appear here.
          </p>
        </div>
      ) : (
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Recent
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {docs.map((doc, i) => {
              const sc = STATUS_COLOR[doc.status] ?? STATUS_COLOR.Archived
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                >
                  <svg
                    width="18" height="18" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={1.75} className="shrink-0"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.88)' }}>
                        {doc.filename}
                      </p>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: 'rgba(129,140,248,0.12)', color: '#818CF8' }}
                      >
                        {docTypeLabel(doc.mimeType ?? null, doc.filename)}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {[
                        doc.source,
                        doc.linkedCompany,
                        new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                      ].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {doc.fileSizeBytes != null && (
                    <span className="text-xs hidden sm:block shrink-0" style={{ color: 'rgba(255,255,255,0.32)' }}>
                      {fmtBytes(doc.fileSizeBytes)}
                    </span>
                  )}
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: sc.bg, color: sc.text }}
                  >
                    {doc.status === 'PendingReview' ? 'Review' : doc.status}
                  </span>
                </div>
              )
            })}
          </div>
          <Link
            href="/os/documents"
            className="block text-center text-xs font-semibold mt-3 py-2"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            View all in Documents →
          </Link>
        </div>
      )}

      {/* ── VaultLine placeholder ────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(129,140,248,0.03)', border: '1px dashed rgba(129,140,248,0.15)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base" aria-hidden>🔒</span>
          <p className="text-xs font-semibold" style={{ color: 'rgba(129,140,248,0.7)' }}>VaultLine</p>
        </div>
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
          Secure storage and retention controls will appear here when VaultLine is enabled.
        </p>
      </div>
    </div>
  )
}
