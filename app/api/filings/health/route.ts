import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  let companies
  try {
    companies = await db.company.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        filings: {
          select: {
            status: true,
            completedAt: true,
          },
        },
      },
    })
  } catch {
    return NextResponse.json({ error: 'Could not load company health' }, { status: 503 })
  }

  const results = companies
    .filter((c) => c.filings.length > 0)
    .map((c) => {
      const overdueCount = c.filings.filter((f) => f.status === 'OVERDUE').length
      const atRiskCount = c.filings.filter((f) => f.status === 'AT_RISK').length
      const upcomingCount = c.filings.filter((f) => f.status === 'UPCOMING').length
      const completedCount = c.filings.filter(
        (f) => f.status === 'COMPLETED' && f.completedAt && f.completedAt >= ninetyDaysAgo
      ).length

      const healthStatus =
        overdueCount > 0 ? 'RED' : atRiskCount > 0 ? 'AMBER' : 'GREEN'

      return {
        companyId: c.id,
        companyName: c.name,
        overdueCount,
        atRiskCount,
        upcomingCount,
        completedCount,
        healthStatus,
      }
    })
    .sort((a, b) => {
      const order: Record<string, number> = { RED: 0, AMBER: 1, GREEN: 2 }
      return (order[a.healthStatus] ?? 3) - (order[b.healthStatus] ?? 3)
    })

  return NextResponse.json({ companies: results })
}
