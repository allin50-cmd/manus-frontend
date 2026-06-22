import Link from 'next/link'

const OVERDUE = [
  {
    company: 'FineGuard Ltd',
    invoice: 'INV-2024-089',
    amount: '£4,800',
    daysOverdue: 4,
    phone: 'tel:+441234567890',
  },
  {
    company: 'Accuracy Developments',
    invoice: 'INV-2024-091',
    amount: '£3,200',
    daysOverdue: 2,
    phone: 'tel:+441234567891',
  },
  {
    company: 'Hawk Construction',
    invoice: 'INV-2024-085',
    amount: '£7,500',
    daysOverdue: 9,
    phone: 'tel:+441234567892',
  },
]

const RECENT_PAYMENTS = [
  { company: 'Premier Build Co', invoice: 'INV-2024-082', amount: '£2,100', date: '20 Jun' },
  { company: 'FineGuard Ltd', invoice: 'INV-2024-078', amount: '£4,800', date: '18 Jun' },
  { company: 'Hawk Construction', invoice: 'INV-2024-074', amount: '£6,200', date: '15 Jun' },
]

export default function MoneyPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 py-5 text-white"
        style={{ background: 'linear-gradient(135deg,#92400E,#B45309)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="13" fill="rgba(255,220,80,0.9)" />
            <circle cx="18" cy="18" r="12.5" fill="none" stroke="rgba(255,240,100,0.4)" strokeWidth="0.75" />
            <text x="18.5" y="23" textAnchor="middle" fontSize="16" fontWeight="900" fill="rgba(80,40,0,0.85)" fontFamily="system-ui,sans-serif">£</text>
          </svg>
        </div>
        <div>
          <div className="text-xs opacity-60 uppercase tracking-wide mb-1">Module</div>
          <div className="text-2xl font-bold tracking-tight">Money</div>
          <div className="text-sm opacity-60 mt-0.5">Revenue · Invoices · Payments</div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Overdue invoices — action needed */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h2 className="text-sm font-bold text-red-600 uppercase tracking-wide">Action Needed — 3 Overdue</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {OVERDUE.map((inv, i) => (
              <div
                key={inv.invoice}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < OVERDUE.length - 1 ? '1px solid #F1F5F9' : 'none' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">{inv.company}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {inv.invoice} · <span className="text-red-500 font-medium">{inv.daysOverdue}d overdue</span>
                  </div>
                </div>
                <div className="text-base font-bold text-slate-900 shrink-0">{inv.amount}</div>
                <div className="flex gap-1.5 shrink-0">
                  <a
                    href={inv.phone}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                    style={{ background: '#EFF6FF', color: '#1D4ED8' }}
                  >
                    📞 Call
                  </a>
                  <button
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                    style={{ background: '#FEF3C7', color: '#92400E' }}
                  >
                    ✉️ Remind
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <h2 className="text-sm font-bold text-green-700 uppercase tracking-wide">Recent Payments</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {RECENT_PAYMENTS.map((p, i) => (
              <div
                key={p.invoice}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < RECENT_PAYMENTS.length - 1 ? '1px solid #F1F5F9' : 'none' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">{p.company}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{p.invoice} · {p.date}</div>
                </div>
                <div className="text-base font-bold text-slate-700 shrink-0">{p.amount}</div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#D1FAE5', color: '#065F46' }}>
                  Paid
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue summary strip */}
        <div
          className="rounded-2xl px-5 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg,#92400E,#B45309)' }}
        >
          <div className="text-white">
            <div className="text-xs opacity-60 uppercase tracking-wide">Monthly Revenue</div>
            <div className="text-2xl font-bold">£42K</div>
          </div>
          <div className="w-px h-10 bg-white opacity-20" />
          <div className="text-white text-right">
            <div className="text-xs opacity-60 uppercase tracking-wide">Collected YTD</div>
            <div className="text-2xl font-bold">£218K</div>
          </div>
        </div>

        {/* Nav hint */}
        <Link
          href="/os"
          className="block text-center text-xs text-slate-400 py-2"
        >
          ← Back to Ultratech OS
        </Link>
      </div>
    </div>
  )
}
