import { requireAuth } from '../../lib/auth'
import { db } from '../../lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PortfolioPage() {
  await requireAuth()

  let companies: Awaited<ReturnType<typeof db.company.findMany>> = []
  let companiesWithCounts: Array<{
    id: string
    name: string
    contacts: number
    workItems: number
    overdue: number
  }> = []

  try {
    companies = await db.company.findMany({
      orderBy: { name: 'asc' },
      take: 200,
    })

    const now = new Date(); now.setHours(0, 0, 0, 0)

    companiesWithCounts = await Promise.all(
      companies.map(async (co) => {
        const [contacts, workItems, overdue] = await Promise.all([
          db.contact.count({ where: { companyId: co.id, isActive: true } }),
          db.workItem.count({
            where: { company: co.name, status: { notIn: ['Archived', 'NotFit', 'Completed'] } },
          }),
          db.workItem.count({
            where: {
              company: co.name,
              dueDate: { lt: now },
              status: { notIn: ['Archived', 'NotFit', 'Completed'] },
            },
          }),
        ])
        return { id: co.id, name: co.name, contacts, workItems, overdue }
      })
    )
  } catch {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-sm text-red-700">
          Could not load portfolio. Please refresh.
        </div>
      </div>
    )
  }

  const totalCompliant = companiesWithCounts.filter((c) => c.overdue === 0).length
  const totalAtRisk = companiesWithCounts.filter((c) => c.overdue > 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Portfolio Management</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage. Monitor. Grow.</p>
      </div>

      {/* Overview banner */}
      <div className="rounded-2xl text-white px-6 py-5 shadow-sm" style={{ background: 'linear-gradient(135deg,#0c2340 0%,#1a3a6c 100%)' }}>
        <div className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">
          🛡️ Portfolio Overview
        </div>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <div className="text-3xl font-extrabold">{companies.length}</div>
            <div className="text-[11px] text-white/50 uppercase tracking-wide mt-0.5">Companies</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-green-400">{totalCompliant}</div>
            <div className="text-[11px] text-white/50 uppercase tracking-wide mt-0.5">Compliant</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-red-400">{totalAtRisk}</div>
            <div className="text-[11px] text-white/50 uppercase tracking-wide mt-0.5">Needs Attention</div>
          </div>
          <div className="hidden sm:block text-center">
            <div className="text-3xl font-extrabold">24/7</div>
            <div className="text-[11px] text-white/50 uppercase tracking-wide mt-0.5">Monitoring</div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {companies.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <div className="text-5xl">🏢</div>
          <p className="font-semibold text-slate-700">No companies yet</p>
          <p className="text-sm text-slate-500">
            Companies are created automatically when work items reference a company name, or add them via{' '}
            <Link href="/contacts" className="text-blue-600 hover:underline">Contacts</Link>.
          </p>
        </div>
      )}

      {/* Company grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {companiesWithCounts.map((co) => {
          const isCompliant = co.overdue === 0
          return (
            <div
              key={co.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow"
            >
              {/* Company header */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl shrink-0">
                  🏢
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-extrabold text-slate-900 text-base leading-tight">{co.name}</h2>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isCompliant
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isCompliant ? '✓ Compliant' : '⚠ Attention'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                  <div className="text-lg font-extrabold text-slate-800">{co.workItems}</div>
                  <div className="text-[10px] text-slate-500 font-medium">Active Items</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                  <div className="text-lg font-extrabold text-slate-800">{co.contacts}</div>
                  <div className="text-[10px] text-slate-500 font-medium">Contacts</div>
                </div>
                <div className={`rounded-xl p-2.5 text-center ${
                  co.overdue > 0 ? 'bg-red-50' : 'bg-green-50'
                }`}>
                  <div className={`text-lg font-extrabold ${co.overdue > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {co.overdue}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Overdue</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Link
                  href={`/work-items?company=${encodeURIComponent(co.name)}`}
                  className="flex-1 text-center text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 transition-colors"
                >
                  View Items
                </Link>
                <Link
                  href={`/contacts?company=${encodeURIComponent(co.id)}`}
                  className="flex-1 text-center text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg py-2 transition-colors"
                >
                  Contacts
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add company link */}
      <div className="text-center py-2">
        <Link
          href="/contacts"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
        >
          + Add a company via Contacts
        </Link>
      </div>
    </div>
  )
}
