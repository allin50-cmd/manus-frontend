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

export default function FineGuardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: 'linear-gradient(135deg, #6EE7B7, #059669)' }}
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">FineGuard</h1>
          <p className="text-slate-500 text-sm">Compliance protection · Customer monitoring</p>
        </div>
      </div>

      {/* Links */}
      <div className="space-y-2">
        <WorkspaceLink href="/portal" label="Customers" desc="View and manage FineGuard customers" external />
        <WorkspaceLink href="/check" label="Check a company" desc="Run a FineGuard compliance check" />
        <WorkspaceLink href="/portal" label="Monitoring" desc="Live monitoring dashboard" external />
        <WorkspaceLink href="/admin" label="Leads dashboard" desc="Admin view of leads and sign-ups" />
      </div>
    </div>
  )
}
