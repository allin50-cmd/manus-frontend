import Link from 'next/link'

function WorkspaceLink({
  href,
  label,
  desc,
  external = false,
}: {
  href: string
  label: string
  desc: string
  external?: boolean
}) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group"
    >
      <div>
        <div className="font-semibold text-slate-900 text-sm">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
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
  )
}

const STATS = [
  { label: 'MRR', val: '£4.8K', chg: '↑ 5%', chgColor: '#16A34A' },
  { label: 'Customers', val: '124', chg: '↑ 3 this month', chgColor: '#16A34A' },
  { label: 'Churn', val: '1.8%', chg: '↓ 0.2%', chgColor: '#16A34A' },
  { label: 'Tickets', val: '3', chg: '1 urgent', chgColor: '#DC2626' },
]

const OPEN_TASKS = [
  {
    title: 'Renewal call — Clare Webb',
    sub: 'Assigned: George · Due today',
    urgency: 'urgent' as const,
  },
  {
    title: 'Pricing decision — Q3 plan',
    sub: 'Decision needed by 30 Jun',
    urgency: 'decision' as const,
  },
]

export default function FineGuardPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 py-5 text-white"
        style={{ background: 'linear-gradient(135deg,#064E3B,#065F46)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
            <path
              d="M18 3L7 8V17C7 23 12 28.5 18 31C24 28.5 29 23 29 17V8L18 3Z"
              fill="rgba(255,255,255,0.9)"
            />
            <path
              d="M14 18L17 21L23 14"
              stroke="rgba(6,79,60,0.8)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <div>
          <div className="text-xs opacity-60 uppercase tracking-wide mb-1">Company Workspace</div>
          <div className="text-2xl font-bold tracking-tight">FineGuard Ltd</div>
          <div className="text-sm opacity-60 mt-0.5">Compliance monitoring SaaS</div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 py-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-xs text-slate-400">{s.label}</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{s.val}</div>
            <div className="text-xs mt-0.5" style={{ color: s.chgColor }}>{s.chg}</div>
          </div>
        ))}
      </div>

      <div className="px-4 space-y-4 pb-8">
        {/* Open Tasks */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Open Tasks</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {OPEN_TASKS.map((task, i) => (
              <Link
                key={task.title}
                href="/os/tasks"
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors"
                style={{ borderBottom: i < OPEN_TASKS.length - 1 ? '1px solid #F1F5F9' : 'none' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">{task.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{task.sub}</div>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                  style={
                    task.urgency === 'urgent'
                      ? { background: '#FEE2E2', color: '#DC2626' }
                      : { background: '#EDE9FE', color: '#5B21B6' }
                  }
                >
                  {task.urgency === 'urgent' ? 'Urgent' : 'Decision'}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Invoice Action */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Action Needed</h2>
          <div
            className="bg-white rounded-2xl shadow-sm p-4"
            style={{ border: '1.5px solid #FECACA' }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-xs text-red-500 font-semibold uppercase tracking-wide">Invoice Overdue</div>
                <div className="text-2xl font-bold text-slate-900 mt-0.5">£4,800</div>
                <div className="text-xs text-slate-500 mt-0.5">Clare Webb · INV-2024-089 · 4 days overdue</div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                Overdue
              </span>
            </div>
            <div className="flex gap-2">
              <a
                href="tel:+441234567890"
                className="flex-1 text-center text-sm font-bold py-2.5 rounded-xl text-white"
                style={{ background: '#065F46' }}
              >
                📞 Call
              </a>
              <button
                className="flex-1 text-center text-sm font-bold py-2.5 rounded-xl"
                style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' }}
              >
                ✉️ Send Reminder
              </button>
            </div>
          </div>
        </div>

        {/* Links */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Workspace</h2>
          <div className="space-y-2">
            <WorkspaceLink href="/portal" label="Customers" desc="View and manage FineGuard customers" external />
            <WorkspaceLink href="/portal" label="Monitoring Dashboard" desc="Live compliance monitoring" external />
            <WorkspaceLink href="#" label="Billing" desc="Invoices and subscription management" />
            <WorkspaceLink href="/os/documents" label="Documents" desc="Contracts, proposals, policies" />
          </div>
        </div>
      </div>
    </div>
  )
}
