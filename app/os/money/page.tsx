import { getDb } from '@/lib/db'
import { osInvoices } from '@/db/schema'
import { desc, sql } from 'drizzle-orm'

function pence(p: number) {
  return `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function daysLabel(d: Date) {
  const diff = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

function statusStyle(s: string) {
  if (s === 'Overdue') return 'bg-red-50 text-red-700 border border-red-200'
  if (s === 'Sent') return 'bg-amber-50 text-amber-700 border border-amber-200'
  if (s === 'Paid') return 'bg-green-50 text-green-700 border border-green-200'
  return 'bg-slate-100 text-slate-500'
}

export const dynamic = 'force-dynamic'

export default async function MoneyPage() {
  const db = await getDb()

  const [invoices, agg] = await Promise.all([
    db.select().from(osInvoices).orderBy(desc(osInvoices.createdAt)).limit(20),
    db
      .select({
        totalPaid: sql<number>`coalesce(sum(amount_pence) filter (where status = 'Paid'), 0)`,
        totalOutstanding: sql<number>`coalesce(sum(amount_pence) filter (where status in ('Sent','Draft')), 0)`,
        dueThisWeek: sql<number>`coalesce(sum(amount_pence) filter (where status != 'Paid' and status != 'Cancelled' and due_at between now() and now() + interval '7 days'), 0)`,
        countOverdue: sql<number>`count(*) filter (where status = 'Overdue')`,
      })
      .from(osInvoices),
  ])

  const stats = agg[0] ?? { totalPaid: 0, totalOutstanding: 0, dueThisWeek: 0, countOverdue: 0 }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #FFD070, #FF8C00)' }}
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M14 9.5c-.6-.9-1.5-1.5-2.5-1.5-1.7 0-3 1.3-3 3s1.3 3 3 3c1 0 1.9-.6 2.5-1.5" />
            <path strokeLinecap="round" d="M12 7v1.5M12 15.5V17" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Money</h1>
          <p className="text-slate-500 text-sm">Revenue · Invoices · Payments</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Revenue (paid)', value: pence(stats.totalPaid) },
          { label: 'Outstanding', value: pence(stats.totalOutstanding) },
          { label: 'Due This Week', value: pence(stats.dueThisWeek) },
          { label: 'Overdue invoices', value: String(stats.countOverdue), urgent: Number(stats.countOverdue) > 0 },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <div className={`text-2xl font-bold ${s.urgent ? 'text-red-600' : 'text-slate-800'}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Invoices</h2>
        {invoices.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
            No invoices yet
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100"
              >
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{inv.clientName}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {inv.number} · {daysLabel(new Date(inv.createdAt))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-slate-900">{pence(inv.amountPence)}</div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle(inv.status)}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
