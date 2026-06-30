import { getDb } from '@/lib/db'
import { fgAlerts, monitoredCompanies } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

interface ComplianceStatusProps {
  companyId: string
}

export default async function ComplianceStatus({ companyId }: ComplianceStatusProps) {
  // Only show for FineGuard
  if (companyId !== 'fineguard') return null

  try {
    const db = await getDb()

    // Get all pending FineGuard alerts
    const pendingAlerts = await db
      .select({ dueDate: fgAlerts.dueDate, alertType: fgAlerts.alertType })
      .from(fgAlerts)
      .where(eq(fgAlerts.status, 'pending'))
      .orderBy(fgAlerts.dueDate)
      .limit(10)

    const pendingCount = pendingAlerts.length
    const nextDueDate = pendingAlerts[0]?.dueDate

    return (
      <section>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Compliance Status
        </p>
        <Link
          href={`/os/workspace/${companyId}/apps/fineguard`}
          className="block p-4 rounded-2xl transition-all hover:scale-[1.01]"
          style={{
            background: pendingCount > 0 ? 'rgba(255,59,48,0.1)' : 'rgba(0,168,107,0.1)',
            border: pendingCount > 0 ? '1px solid rgba(255,59,48,0.2)' : '1px solid rgba(0,168,107,0.2)',
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-bold"
                style={{ color: pendingCount > 0 ? '#FF3B30' : '#00A86B' }}
              >
                FineGuard
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="shrink-0"
                style={{ color: pendingCount > 0 ? '#FF3B30' : '#00A86B' }}
              >
                {pendingCount > 0 ? (
                  <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z M9 12l2 2 4-4" />
                ) : (
                  <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z M9 12l2 2 4-4" />
                )}
              </svg>
            </div>
            {pendingCount > 0 && (
              <span
                className="text-[11px] font-bold px-2 py-1 rounded-full"
                style={{
                  background: 'rgba(255,59,48,0.2)',
                  color: '#FF3B30',
                }}
              >
                {pendingCount} pending
              </span>
            )}
          </div>

          {pendingCount === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.6)' }} className="text-sm">
              ✓ All deadlines on track
            </p>
          ) : (
            <>
              <p style={{ color: 'rgba(255,255,255,0.6)' }} className="text-sm mb-1">
                {pendingCount} alert{pendingCount !== 1 ? 's' : ''} pending
              </p>
              {nextDueDate && (
                <p style={{ color: 'rgba(255,255,255,0.4)' }} className="text-xs">
                  Next due:{' '}
                  {new Date(nextDueDate).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
            </>
          )}
        </Link>
      </section>
    )
  } catch (err) {
    console.error('Error fetching compliance status:', err)
    return null
  }
}
