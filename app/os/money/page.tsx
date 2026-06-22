import Link from 'next/link'

const STATS = [
  { label: 'Revenue Today', value: '—' },
  { label: 'Outstanding', value: '—' },
  { label: 'Due This Week', value: '—' },
  { label: 'Overdue', value: '—' },
]

const QUICK_ACTIONS = [
  { href: '#', label: 'Create Invoice', desc: 'Draft a new invoice' },
  { href: '#', label: 'View Payments', desc: 'Payment history and status' },
  { href: '#', label: 'Subscriptions', desc: 'Recurring revenue' },
]

export default function MoneyPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="text-2xl font-bold text-slate-400">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Actions</h2>
        <div className="space-y-2">
          {QUICK_ACTIONS.map((qa) => (
            <Link
              key={qa.label}
              href={qa.href}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group"
            >
              <div>
                <div className="font-semibold text-slate-900 text-sm">{qa.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{qa.desc}</div>
              </div>
              <svg
                className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Coming soon note */}
      <div className="mt-8 p-4 bg-slate-50 border border-slate-100 rounded-xl">
        <p className="text-sm text-slate-500">
          Full invoicing and revenue tracking is coming. Data will flow automatically from your existing products.
        </p>
      </div>
    </div>
  )
}
