import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import { osPeople } from '@/db/schema'
import { getCompany } from '@/lib/company-registry'
import { desc, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  Client:   { bg: 'rgba(168,85,247,0.15)',  color: '#A855F7' },
  Partner:  { bg: 'rgba(61,139,255,0.15)',  color: '#3D8BFF' },
  Supplier: { bg: 'rgba(129,140,248,0.15)', color: '#818CF8' },
  Team:     { bg: 'rgba(40,199,111,0.15)',  color: '#28C76F' },
  Prospect: { bg: 'rgba(255,193,69,0.15)',  color: '#FFC145' },
}

export default async function WorkspacePeoplePage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  const db = await getDb()

  const [people, agg] = await Promise.all([
    db.select().from(osPeople).orderBy(desc(osPeople.createdAt)).limit(20),
    db
      .select({
        total:    sql<number>`count(*)`,
        clients:  sql<number>`count(*) filter (where category = 'Client')`,
        partners: sql<number>`count(*) filter (where category = 'Partner')`,
        team:     sql<number>`count(*) filter (where category = 'Team')`,
        prospects: sql<number>`count(*) filter (where category = 'Prospect')`,
      })
      .from(osPeople),
  ])

  const s = agg[0] ?? { total: 0, clients: 0, partners: 0, team: 0, prospects: 0 }
  const total = Number(s.total)

  const stats = [
    { label: 'Clients',  value: Number(s.clients),  color: '#A855F7' },
    { label: 'Partners', value: Number(s.partners), color: '#3D8BFF' },
    { label: 'Team',     value: Number(s.team),     color: '#28C76F' },
    { label: 'Prospects',value: Number(s.prospects),color: '#FFC145' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>People</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {total} contact{total !== 1 ? 's' : ''} across {company.name}
          </p>
        </div>
        <Link
          href="/os/contacts"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.2)' }}
        >
          + Add
        </Link>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{s.label}</p>
            </div>
            <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* People list */}
      {people.length === 0 ? (
        <div
          className="rounded-2xl p-10 flex flex-col items-center text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}
        >
          <span className="text-3xl mb-3" aria-hidden>👤</span>
          <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>No contacts yet</p>
          <Link
            href="/os/contacts"
            className="mt-3 text-xs font-semibold px-4 py-2 rounded-xl"
            style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.2)' }}
          >
            Add first contact
          </Link>
        </div>
      ) : (
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          >
            Recent
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {people.map((person, i) => {
              const initials = (person.avatarInitials ?? person.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)).toUpperCase()
              const cat = CATEGORY_STYLE[person.category ?? ''] ?? { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }
              return (
                <div
                  key={person.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: 'rgba(168,85,247,0.18)', color: '#C084FC', border: '1px solid rgba(168,85,247,0.25)' }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.88)' }}>
                        {person.name}
                      </span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: cat.bg, color: cat.color }}
                      >
                        {person.category ?? 'Contact'}
                      </span>
                    </div>
                    {(person.role || person.company) && (
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {[person.role, person.company].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  {person.phone && (
                    <span className="text-xs hidden sm:block shrink-0" style={{ color: 'rgba(255,255,255,0.32)' }}>
                      {person.phone}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <Link
            href="/os/contacts"
            className="block text-center text-xs font-semibold mt-3 py-2"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            View all in Contacts →
          </Link>
        </div>
      )}
    </div>
  )
}
