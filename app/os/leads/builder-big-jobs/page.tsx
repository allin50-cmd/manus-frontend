import { requireAuth } from '@/lib/auth'
import { getDb, builderBigJobsLeads } from '@/lib/db'
import { desc } from 'drizzle-orm'
import Link from 'next/link'
import LeadStatusEditor from './LeadStatusEditor'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  contacted: 'Contacted',
  site_visit_booked: 'Site visit',
  quoted: 'Quoted',
  won: 'Won',
  lost: 'Lost',
  not_suitable: 'Not suitable',
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  qualified: 'bg-purple-100 text-purple-700',
  contacted: 'bg-yellow-100 text-yellow-800',
  site_visit_booked: 'bg-orange-100 text-orange-700',
  quoted: 'bg-cyan-100 text-cyan-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-slate-100 text-slate-600',
  not_suitable: 'bg-slate-100 text-slate-500',
}

function scoreBadge(score: number) {
  if (score >= 70) return 'bg-green-100 text-green-700 font-bold'
  if (score >= 40) return 'bg-yellow-100 text-yellow-700'
  return 'bg-slate-100 text-slate-600'
}

export default async function BuilderBigJobsLeadsPage() {
  await requireAuth()

  const db = await getDb()
  const leads = await db
    .select()
    .from(builderBigJobsLeads)
    .orderBy(desc(builderBigJobsLeads.leadScore), desc(builderBigJobsLeads.createdAt))

  const counts = {
    new: leads.filter((l) => l.status === 'new').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    site_visit_booked: leads.filter((l) => l.status === 'site_visit_booked').length,
    quoted: leads.filter((l) => l.status === 'quoted').length,
    won: leads.filter((l) => l.status === 'won').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Builder Big Jobs — Leads</h1>
          <p className="text-slate-500 text-sm mt-1">{leads.length} total · owner: Dagon</p>
        </div>
        <Link
          href="/builder-big-jobs"
          target="_blank"
          className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          Public page ↗
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {[
          { label: 'New', value: counts.new, color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Qualified', value: counts.qualified, color: 'bg-purple-50 border-purple-200 text-purple-700' },
          { label: 'Contacted', value: counts.contacted, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: 'Site visits', value: counts.site_visit_booked, color: 'bg-orange-50 border-orange-200 text-orange-700' },
          { label: 'Quoted', value: counts.quoted, color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
          { label: 'Won', value: counts.won, color: 'bg-green-50 border-green-200 text-green-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs font-medium opacity-80 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {leads.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center text-slate-400">
          No leads yet. Share the intake form to get started.
          <div className="mt-3">
            <Link href="/intake/builder-big-jobs" className="text-blue-600 text-sm hover:underline">
              /intake/builder-big-jobs
            </Link>
          </div>
        </div>
      )}

      {/* Leads table — desktop */}
      {leads.length > 0 && (
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Score', 'Company', 'Contact', 'Email', 'Phone', 'Job types', 'Postcode', 'Status', 'Assigned', 'Date'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3">
                    <span className={`text-xs font-semibold rounded px-2 py-1 ${scoreBadge(lead.leadScore)}`}>
                      {lead.leadScore}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-900 whitespace-nowrap">{lead.companyName}</td>
                  <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{lead.contactName}</td>
                  <td className="px-3 py-3 text-slate-600 text-xs">{lead.email}</td>
                  <td className="px-3 py-3 text-slate-600 text-xs whitespace-nowrap">{lead.phone ?? '—'}</td>
                  <td className="px-3 py-3 text-slate-600 text-xs max-w-[160px] truncate">{lead.jobTypes ?? '—'}</td>
                  <td className="px-3 py-3 text-slate-600 text-xs">{lead.postcodeArea ?? '—'}</td>
                  <td className="px-3 py-3">
                    <LeadStatusEditor leadId={lead.id} currentStatus={lead.status} />
                  </td>
                  <td className="px-3 py-3">
                    <LeadStatusEditor leadId={lead.id} currentAssigned={lead.assignedTo} mode="assignee" />
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(lead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {leads.length > 0 && (
        <div className="sm:hidden space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{lead.companyName}</p>
                  <p className="text-xs text-slate-500">{lead.contactName} · {lead.email}</p>
                </div>
                <span className={`text-xs font-bold rounded px-2 py-1 shrink-0 ${scoreBadge(lead.leadScore)}`}>
                  {lead.leadScore}
                </span>
              </div>
              {lead.jobTypes && <p className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-1">{lead.jobTypes}</p>}
              <div className="flex gap-2 flex-wrap">
                <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_COLORS[lead.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {STATUS_LABELS[lead.status] ?? lead.status}
                </span>
                {lead.assignedTo && (
                  <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">{lead.assignedTo}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
