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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {justActivated && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                ✓ Payment confirmed — monitoring is now active
                {searchParams.company ? ` for company ${searchParams.company}` : ''}.
              </p>
            </div>
          )}

          {/* Header */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Monitor your Companies House compliance in one place
              </p>
            </div>
            <Link
              href="/check"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap"
            >
              + Add company
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { label: 'Companies Monitored', value: companies.length, icon: '📊' },
              { label: 'Active Subscriptions', value: companies.length, icon: '🔔' },
              { label: 'Added This Month', value: activatedThisMonth, icon: '📅' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                  </div>
                  <div className="text-4xl">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Monitored Companies */}
          <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Monitored Companies</h2>

            {companies.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You&apos;re not monitoring any companies yet.
                </p>
                <Link
                  href="/check"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition"
                >
                  Search for a company
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Company</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Activated</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr
                        key={company.id}
                        className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                      >
                        <td className="py-4 px-4">
                          <p className="font-medium text-gray-900 dark:text-white">{company.companyName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{company.companyNumber}</p>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(company.activatedAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
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
          <div className="mt-8 p-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg">
            <h3 className="text-2xl font-bold mb-2">Need more companies?</h3>
            <p className="mb-4 opacity-90">Find and monitor additional UK companies with instant alerts</p>
            <Link
              href="/check"
              className="inline-block bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Search Companies
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
