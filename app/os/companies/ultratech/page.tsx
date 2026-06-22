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

export default function UltratechPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: 'linear-gradient(135deg, #93C5FD, #2563EB)' }}
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ultratech</h1>
          <p className="text-slate-500 text-sm">Operations · Projects · Communications</p>
        </div>
      </div>

      {/* Links */}
      <div className="space-y-2">
        <WorkspaceLink href="/os/work-items" label="Work Items" desc="All tasks, projects and work items" />
        <WorkspaceLink href="/os/today" label="Today's Tasks" desc="Actions due and scheduled for today" />
        <WorkspaceLink href="/os/decisions" label="Decisions" desc="Items requiring a decision" />
        <WorkspaceLink href="/os/activity" label="Activity Log" desc="Recent activity across all work items" />
        <WorkspaceLink href="/os/templates" label="Templates" desc="Work item and action templates" />
      </div>
    </div>
  )
}
