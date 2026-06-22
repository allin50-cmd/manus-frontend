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

const PRODUCTS = [
  {
    name: 'FineGuard',
    desc: 'Compliance monitoring SaaS',
    status: 'Active',
    statusBg: '#D1FAE5',
    statusColor: '#065F46',
    dotColor: '#065F46',
  },
  {
    name: 'Builder Big Jobs',
    desc: 'Construction lead pipeline',
    status: 'Active',
    statusBg: '#FFEDD5',
    statusColor: '#9A3412',
    dotColor: '#C2410C',
  },
  {
    name: 'Accuracy Developments',
    desc: 'Planning leads · Projects',
    status: 'Pipeline',
    statusBg: '#EDE9FE',
    statusColor: '#5B21B6',
    dotColor: '#6D28D9',
  },
]

export default function UltratechPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 py-5 text-white"
        style={{ background: 'linear-gradient(135deg,#1E3A5F,#1D4ED8)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
            <path
              d="M21 4L8 20H18L15 32L28 16H18L21 4Z"
              fill="rgba(255,255,255,0.9)"
            />
          </svg>
        </div>
        <div>
          <div className="text-xs opacity-60 uppercase tracking-wide mb-1">Company Workspace</div>
          <div className="text-2xl font-bold tracking-tight">Ultratech</div>
          <div className="text-sm opacity-60 mt-0.5">Operations · Internal tools · Products</div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 pb-8">
        {/* Products */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Products</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {PRODUCTS.map((product, i) => (
              <div
                key={product.name}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < PRODUCTS.length - 1 ? '1px solid #F1F5F9' : 'none' }}
              >
                {/* Company-coloured dot indicator */}
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: product.dotColor }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900">{product.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{product.desc}</div>
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                  style={{ background: product.statusBg, color: product.statusColor }}
                >
                  {product.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Workspace</h2>
          <div className="space-y-2">
            <WorkspaceLink href="#" label="Opportunities" desc="Pipeline and growth opportunities" />
            <WorkspaceLink href="/os/decisions" label="Decisions" desc="Items requiring a decision" />
            <WorkspaceLink href="/os/tasks" label="Tasks" desc="Work items and actions" />
            <WorkspaceLink href="/os/contacts" label="Team" desc="Team members and contacts" />
          </div>
        </div>
      </div>
    </div>
  )
}
