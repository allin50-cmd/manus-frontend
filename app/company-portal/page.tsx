import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { monitoredCompanies } from '@/db/schema'
import { desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function CompanyPortalPage({
  searchParams,
}: {
  searchParams: { activated?: string; company?: string }
}) {
  await requireAuth()

  const justActivated = searchParams.activated === '1'

  const db = await getDb()
  const companies = await db
    .select()
    .from(monitoredCompanies)
    .orderBy(desc(monitoredCompanies.activatedAt))

  const now = new Date()
  const activatedThisMonth = companies.filter((c) => {
    const d = new Date(c.activatedAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {justActivated && (
            <div className="mb-6 p-4 bg-[#E6F7F1] border border-[#00A86B]/30 rounded-xl">
              <p className="text-sm font-medium text-[#00A86B]">
                ✓ Payment confirmed — monitoring is now active
                {searchParams.company ? ` for ${searchParams.company}` : ''}.
              </p>
            </div>
          )}

          {/* Header */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Your Dashboard</h1>
              <p className="text-slate-500 mt-2">
                Monitor your Companies House compliance in one place
              </p>
            </div>
            <Link
              href="/check"
              className="bg-[#00A86B] hover:bg-[#009960] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              + Add company
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              {
                label: 'Companies Monitored',
                value: companies.length,
                icon: (
                  <svg className="w-6 h-6 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
              },
              {
                label: 'Active Subscriptions',
                value: companies.length,
                icon: (
                  <svg className="w-6 h-6 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                ),
              },
              {
                label: 'Added This Month',
                value: activatedThisMonth,
                icon: (
                  <svg className="w-6 h-6 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#E6F7F1] rounded-xl flex items-center justify-center">
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Monitored Companies */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Monitored Companies</h2>

            {companies.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-[#E6F7F1] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-slate-500 mb-4">
                  You&apos;re not monitoring any companies yet.
                </p>
                <Link
                  href="/check"
                  className="inline-block bg-[#00A86B] hover:bg-[#009960] text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  Search for a company
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 text-sm">Company</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 text-sm">Activated</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr
                        key={company.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <p className="font-medium text-slate-900">{company.companyName}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{company.companyNumber}</p>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-500">
                          {new Date(company.activatedAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E6F7F1] text-[#00A86B]">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-8 p-8 bg-[#0B1F3A] rounded-xl text-white">
            <h3 className="text-xl font-bold mb-2">Need more companies?</h3>
            <p className="mb-4 text-slate-300 text-sm">Find and monitor additional UK companies with instant deadline alerts.</p>
            <Link
              href="/check"
              className="inline-block bg-[#00A86B] hover:bg-[#009960] text-white px-6 py-2 rounded-lg font-semibold transition-colors text-sm"
            >
              Search Companies
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
