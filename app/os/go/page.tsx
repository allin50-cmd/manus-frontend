import Link from 'next/link'
import { getDb, osTasks } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { and, gte, like } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date: Date): string {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default async function GoPage() {
  await requireAuth()
  const db = await getDb()

  const now = new Date()
  const upcoming = await db
    .select()
    .from(osTasks)
    .where(and(gte(osTasks.dueAt, now), like(osTasks.title, 'Appointment:%')))
    .limit(20)

  return (
    <div
      className="min-h-screen pb-28 lg:pb-0"
      style={{ background: 'linear-gradient(160deg, #050816 0%, #071120 55%, #0B1830 100%)' }}
    >
      <div className="max-w-sm mx-auto px-4 pt-8">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/os"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Go</h1>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Route Planner</p>
          </div>
        </div>

        {/* TODO: Phase 2 — Maps integration, travel time, parking */}
        <div
          className="rounded-2xl p-4 mb-6 flex items-start gap-3"
          style={{ background: 'rgba(255,59,48,0.07)', border: '1px solid rgba(255,59,48,0.15)' }}
        >
          <span style={{ fontSize: '1.2em', lineHeight: 1 }} aria-hidden>🗺️</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>Maps &amp; travel time coming soon</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Routes, travel time, and parking will appear here.
            </p>
          </div>
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
          UPCOMING APPOINTMENTS
        </p>

        {upcoming.length === 0 ? (
          <div
            className="rounded-2xl p-10 flex flex-col items-center text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
          >
            <span className="text-4xl mb-3" aria-hidden>📍</span>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>No upcoming appointments</p>
            <Link
              href="/os/book"
              className="mt-3 text-xs font-semibold px-4 py-2 rounded-xl"
              style={{ background: 'rgba(255,59,48,0.12)', color: '#FF6B6B', border: '1px solid rgba(255,59,48,0.2)' }}
            >
              Book one now
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appt) => {
              const date = appt.dueAt
              const contact = appt.title.replace('Appointment: ', '')
              const location = (appt.notes ?? '')
                .split('\n')
                .find((l) => l.startsWith('Location: '))
                ?.replace('Location: ', '') ?? null
              return (
                <div
                  key={appt.id}
                  className="rounded-2xl px-4 py-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  {/* TODO: Phase 2 — tap opens route view with travel time */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>{contact}</p>
                      {location && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          📍 {location}
                        </p>
                      )}
                    </div>
                    {date && (
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold" style={{ color: '#FF6B6B' }}>{formatDate(date)}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.9)' }}>{formatTime(date)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Link
          href="/os/book"
          className="flex items-center justify-center gap-2 w-full mt-4 py-3.5 rounded-2xl text-sm font-semibold"
          style={{ background: 'rgba(255,59,48,0.1)', color: '#FF6B6B', border: '1px solid rgba(255,59,48,0.2)' }}
        >
          <span aria-hidden>+</span>
          Book Appointment
        </Link>
      </div>
    </div>
  )
}
