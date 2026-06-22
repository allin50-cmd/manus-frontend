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

export default function AccuracyPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 py-5 text-white"
        style={{ background: 'linear-gradient(135deg,#4C1D95,#6D28D9)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="13" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" fill="none" />
            <circle cx="18" cy="18" r="8" stroke="rgba(255,255,255,0.65)" strokeWidth="2" fill="none" />
            <circle cx="18" cy="18" r="3.5" fill="rgba(255,255,255,0.9)" />
            <line x1="18" y1="5" x2="18" y2="9" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="18" y1="27" x2="18" y2="31" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="5" y1="18" x2="9" y2="18" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="27" y1="18" x2="31" y2="18" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="text-xs opacity-60 uppercase tracking-wide mb-1">Company Workspace</div>
          <div className="text-2xl font-bold tracking-tight">Accuracy Developments</div>
          <div className="text-sm opacity-60 mt-0.5">Planning leads · Projects · Site visits</div>
        </div>
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-2 gap-3 px-4 py-4">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-xs text-slate-400">Stage</div>
          <div className="text-base font-bold text-slate-900 mt-0.5">Proposal</div>
          <div className="text-xs text-purple-600 mt-0.5">Awaiting review</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-xs text-slate-400">Est. Value</div>
          <div className="text-base font-bold text-slate-900 mt-0.5">£24K / yr</div>
          <div className="text-xs text-slate-400 mt-0.5">Annual contract</div>
        </div>
      </div>

      <div className="px-4 space-y-4 pb-8">
        {/* Primary action */}
        <button
          className="w-full text-center text-sm font-bold py-3.5 rounded-2xl text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg,#4C1D95,#6D28D9)' }}
        >
          Send Proposal
        </button>

        {/* Open Tasks */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Open Tasks</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <Link
              href="/os/tasks"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-900 truncate">Planning lead follow-up — Alissa</div>
                <div className="text-xs text-slate-400 mt-0.5">Assigned: Alissa · This week</div>
              </div>
              <span
                className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                style={{ background: '#FEF3C7', color: '#92400E' }}
              >
                Pending
              </span>
            </Link>
          </div>
        </div>

        {/* Key Contacts */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Key Contacts</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg,#4C1D95,#6D28D9)' }}
              >
                ST
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-900">Sarah Thornton</div>
                <div className="text-xs text-slate-400 mt-0.5">Accuracy Developments</div>
              </div>
              <a
                href="mailto:sarah@accuracy.co.uk"
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                style={{ background: '#EDE9FE', color: '#5B21B6' }}
              >
                ✉️ Email
              </a>
            </div>
          </div>
        </div>

        {/* Links */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Workspace</h2>
          <div className="space-y-2">
            <WorkspaceLink href="#" label="Projects" desc="Active and pipeline projects" />
            <WorkspaceLink href="#" label="Estimates" desc="Quotes and cost estimates" />
            <WorkspaceLink href="#" label="Site Visits" desc="Scheduled and completed visits" />
            <WorkspaceLink href="#" label="Customers" desc="Accuracy client contacts" />
          </div>
        </div>
      </div>
    </div>
  )
}
