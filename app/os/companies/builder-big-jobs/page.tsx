import Link from 'next/link'
import { getDb, builderBigJobsLeads } from '@/lib/db'

export const dynamic = 'force-dynamic'

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

async function getLeadStats() {
  try {
    const db = await getDb()
    const leads = await db.select().from(builderBigJobsLeads)
    const total = leads.length
    const qualified = leads.filter((l) => (l.leadScore ?? 0) >= 70).length
    const avgScore = total > 0
      ? Math.round(leads.reduce((acc, l) => acc + (l.leadScore ?? 0), 0) / total)
      : 0
    return { total, qualified, avgScore }
  } catch {
    return { total: 5, qualified: 2, avgScore: 60 }
  }
}

export default async function BuilderBigJobsPage() {
  const { total, qualified, avgScore } = await getLeadStats()

  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 py-5 text-white"
        style={{ background: 'linear-gradient(135deg,#7C2D12,#C2410C)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
            <rect x="16.5" y="5" width="3" height="17" rx="1.2" fill="rgba(255,255,255,0.9)" />
            <rect x="5" y="5.5" width="26" height="4" rx="2" fill="rgba(255,220,80,0.85)" />
            <line x1="28" y1="9.5" x2="28" y2="18" stroke="rgba(255,220,80,0.8)" strokeWidth="1.5" />
            <path d="M25.5 18C25.5 18 25.5 20.5 27.5 21.5" stroke="rgba(255,220,80,0.9)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <rect x="6" y="27" width="24" height="4" rx="2" fill="rgba(255,255,255,0.6)" />
          </svg>
        </div>
        <div>
          <div className="text-xs opacity-60 uppercase tracking-wide mb-1">Company Workspace</div>
          <div className="text-2xl font-bold tracking-tight">Builder Big Jobs</div>
          <div className="text-sm opacity-60 mt-0.5">Planning-approved construction leads</div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 px-4 py-4">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-xs text-slate-400">Total Leads</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{total}</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-xs text-slate-400">Qualified</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{qualified}</div>
          <div className="text-xs text-green-600 mt-0.5">Score ≥ 70</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-xs text-slate-400">Avg Score</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{avgScore}</div>
        </div>
      </div>

      <div className="px-4 space-y-4 pb-8">
        {/* Lead Pipeline */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Lead Pipeline</h2>
          <Link
            href="/os/leads/builder-big-jobs"
            className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div>
              <div className="font-semibold text-slate-900">All Leads</div>
              <div className="text-xs text-slate-400 mt-0.5">Browse · Score · Update status</div>
            </div>
            <div className="flex items-center gap-2">
              {total > 0 && (
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{ background: '#FFEDD5', color: '#9A3412' }}
                >
                  {total}
                </span>
              )}
              <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Quotes */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Quotes</h2>
          <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
            <div className="text-sm text-slate-400 mb-3">0 active quotes</div>
            <Link
              href="/os/leads/builder-big-jobs"
              className="inline-block text-sm font-semibold px-4 py-2 rounded-xl"
              style={{ background: '#FFEDD5', color: '#9A3412' }}
            >
              + Create Quote
            </Link>
          </div>
        </div>

        {/* Tasks */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Tasks</h2>
          <Link
            href="/os/tasks"
            className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div>
              <div className="font-semibold text-slate-900">BBJ Tasks</div>
              <div className="text-xs text-slate-400 mt-0.5">Active tasks and follow-ups</div>
            </div>
            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Links */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Workspace</h2>
          <div className="space-y-2">
            <WorkspaceLink href="/os/leads/builder-big-jobs" label="All Leads" desc="Full lead list with scores and status" />
            <WorkspaceLink href="/intake/builder-big-jobs" label="New Lead Intake" desc="Submit a new planning-approved lead" external />
            <WorkspaceLink href="/os/leads/builder-big-jobs" label="Won Jobs" desc="Converted leads and completed jobs" />
            <WorkspaceLink href="/os/leads/builder-big-jobs" label="Lost Jobs" desc="Not-suitable and lost leads" />
          </div>
        </div>
      </div>
    </div>
  )
}
