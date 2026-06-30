import { getDb } from '@/lib/db'
import { osInvoices } from '@/db/schema'
import { desc, sql } from 'drizzle-orm'
import Link from 'next/link'

function pence(p: number) {
  return `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function daysLabel(d: Date) {
  const diff = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

function statusBadge(s: string): { bg: string; color: string } {
  if (s === 'Paid') return { bg: 'rgba(40,199,111,0.15)', color: '#28C76F' }
  if (s === 'Sent') return { bg: 'rgba(255,159,10,0.15)', color: '#FF9F0A' }
  if (s === 'Overdue') return { bg: 'rgba(255,59,48,0.15)', color: '#FF3B30' }
  return { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }
}

export const dynamic = 'force-dynamic'

export default async function MoneyPage() {
  const db = await getDb()

  const [invoices, agg] = await Promise.all([
    db.select().from(osInvoices).orderBy(desc(osInvoices.createdAt)).limit(8),
    db
      .select({
        totalPaid: sql<number>`coalesce(sum(amount_pence) filter (where status = 'Paid'), 0)`,
        totalOutstanding: sql<number>`coalesce(sum(amount_pence) filter (where status in ('Sent','Draft')), 0)`,
        dueThisWeek: sql<number>`coalesce(sum(amount_pence) filter (where status != 'Paid' and status != 'Cancelled' and due_at between now() and now() + interval '7 days'), 0)`,
        countOverdue: sql<number>`count(*) filter (where status = 'Overdue')`,
        countInvoices: sql<number>`count(*)`,
      })
      .from(osInvoices),
  ])

  const stats = agg[0] ?? { totalPaid: 0, totalOutstanding: 0, dueThisWeek: 0, countOverdue: 0, countInvoices: 0 }

  const sections = [
    { label: 'Revenue', color: '#FFD000', count: 0, icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
      </svg>
    ) },
    { label: 'Invoices', color: '#FFC145', count: Number(stats.countInvoices), icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ) },
    { label: 'Banking', color: '#A0C4FF', count: 0, icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ) },
    { label: 'Subscriptions', color: '#C084FC', count: 0, icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      </svg>
    ) },
    { label: 'Forecast', color: '#34D399', count: 0, icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ) },
  ]

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Module header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="relative w-[60px] h-[60px] rounded-[20px] shrink-0 overflow-hidden flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle at 30% 20%, #FFF0A0 0%, #FFD000 50%, #A85C00 100%)',
              boxShadow: '0 16px 40px -8px rgba(255,193,69,0.55), 0 4px 14px -2px rgba(0,0,0,0.6), inset 0 1.5px 0 rgba(255,255,255,0.45)',
            }}
          >
            <div
              className="absolute inset-x-0 top-0 pointer-events-none z-10"
              style={{ height: '55%', background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)', borderRadius: '20px 20px 0 0' }}
            />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(120,60,0,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 20 }}>
              <circle cx="12" cy="12" r="9" />
              <path d="M14.5 9.5c-.7-1-1.8-1.5-2.8-1.5-1.9 0-3.2 1.3-3.2 3s1.3 3 3.2 3c1 0 2-.5 2.8-1.5" />
              <line x1="12" y1="6.5" x2="12" y2="8" />
              <line x1="12" y1="16" x2="12" y2="17.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Money</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {pence(Number(stats.totalPaid))} revenue · {Number(stats.countOverdue) > 0 ? `${Number(stats.countOverdue)} overdue` : 'All clear'}
            </p>
          </div>
        </div>

        {/* Overdue banner */}
        {Number(stats.countOverdue) > 0 && (
          <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(255,59,48,0.07)', border: '1px solid rgba(255,59,48,0.14)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold" style={{ color: '#FF3B30' }}>{Number(stats.countOverdue)} OVERDUE</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {pence(Number(stats.totalOutstanding))} outstanding
                </p>
              </div>
              <button className="text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                style={{ background: 'rgba(255,59,48,0.15)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.25)' }}>
                Chase All
              </button>
            </div>
          </div>
        )}

        {/* Sub-sections */}
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest px-4 pt-3 pb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
            SECTIONS
          </p>
          {sections.map((s, i) => (
            <div
              key={s.label}
              className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
              style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${s.color}18`, border: `1px solid ${s.color}30`, color: s.color }}
              >
                {s.icon}
              </div>
              <span className="flex-1 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{s.label}</span>
              {s.count > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${s.color}20`, color: s.color }}>{s.count}</span>
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>

        {/* Recent invoices */}
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
            RECENT INVOICES
          </p>
          {invoices.length === 0 ? (
            <div className="rounded-2xl p-8 text-center text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
              No invoices yet
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {(() => {
                const order: Record<string, number> = { Overdue: 0, Sent: 1, Draft: 2, Paid: 3, Cancelled: 4 }
                const sorted = [...invoices].sort((a, b) => (order[a.status] ?? 5) - (order[b.status] ?? 5))
                return sorted.map((inv, i) => {
                const badge = statusBadge(inv.status)
                return (
                  <div
                    key={inv.id}
                    className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.06)' : undefined }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>{inv.clientName}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.32)' }}>
                        {inv.number} · {daysLabel(new Date(inv.createdAt))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>{pence(inv.amountPence)}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                )
              })
              })()}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Link
            href="/os/money/invoices/new"
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 text-center"
            style={{ background: 'linear-gradient(135deg, #FFD000, #FFA500)', color: '#3A1800', boxShadow: '0 4px 16px rgba(255,193,69,0.3)' }}
          >
            New Invoice
          </Link>
          <Link
            href="/os/money/quotes/new"
            className="px-5 py-3 rounded-xl text-sm font-medium text-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.7)' }}
          >
            New Quote
          </Link>
        </div>

      </div>
    </div>
  )
}
