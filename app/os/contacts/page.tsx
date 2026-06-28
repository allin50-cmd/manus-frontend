import { getDb } from '@/lib/db'
import { osPeople } from '@/db/schema'
import { desc, sql } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function categoryBadge(category: string | null) {
  switch (category) {
    case 'Client':
      return { bg: 'rgba(168,85,247,0.15)', color: '#A855F7' }
    case 'Partner':
      return { bg: 'rgba(61,139,255,0.15)', color: '#3D8BFF' }
    case 'Supplier':
      return { bg: 'rgba(129,140,248,0.15)', color: '#818CF8' }
    case 'Team':
      return { bg: 'rgba(40,199,111,0.15)', color: '#28C76F' }
    case 'Prospect':
      return { bg: 'rgba(255,193,69,0.15)', color: '#FFC145' }
    default:
      return { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }
  }
}

export default async function ContactsPage() {
  const db = await getDb()

  const [people, agg] = await Promise.all([
    db.select().from(osPeople).orderBy(desc(osPeople.createdAt)).limit(20),
    db.select({
      total: sql<number>`count(*)`,
      clients: sql<number>`count(*) filter (where category = 'Client')`,
      partners: sql<number>`count(*) filter (where category = 'Partner')`,
      suppliers: sql<number>`count(*) filter (where category = 'Supplier')`,
      team: sql<number>`count(*) filter (where category = 'Team')`,
      prospects: sql<number>`count(*) filter (where category = 'Prospect')`,
    }).from(osPeople),
  ])

  const s = agg[0] ?? { total: 0, clients: 0, partners: 0, suppliers: 0, team: 0, prospects: 0 }

  const sections = [
    { label: 'Customers', count: Number(s.clients), color: '#A855F7' },
    { label: 'Suppliers', count: Number(s.suppliers), color: '#818CF8' },
    { label: 'Partners', count: Number(s.partners), color: '#3D8BFF' },
    { label: 'Staff / Team', count: Number(s.team), color: '#28C76F' },
    { label: 'Favourites', count: 0, color: '#FFC145' },
  ]

  const displayPeople = people.slice(0, 15)

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Module Header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="relative w-[60px] h-[60px] rounded-[20px] shrink-0 overflow-hidden flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 30% 20%, #E0A8FF 0%, #A855F7 50%, #550090 100%)',
            boxShadow:
              '0 16px 40px -8px rgba(168,85,247,0.55), 0 4px 14px -2px rgba(0,0,0,0.6), inset 0 1.5px 0 rgba(255,255,255,0.45)',
          }}
        >
          <div
            className="absolute inset-x-0 top-0 pointer-events-none z-10"
            style={{
              height: '55%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)',
              borderRadius: '20px 20px 0 0',
            }}
          />
          <svg
            className="relative z-20 w-7 h-7 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>
            Contacts
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            People, clients &amp; partners
          </p>
        </div>
      </div>

      {/* Sub-sections */}
      <div
        className="rounded-2xl overflow-hidden mb-6"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {sections.map((section, i) => (
          <div
            key={section.label}
            className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
            style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
          >
            <span className="flex-1 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {section.label}
            </span>
            {section.count > 0 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${section.color}20`, color: section.color }}
              >
                {section.count}
              </span>
            )}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="2.5"
            >
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>

      {/* Contact List */}
      <div
        className="rounded-2xl overflow-hidden mb-6"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'rgba(255,255,255,0.32)' }}
          >
            Recent Contacts
          </span>
        </div>

        {displayPeople.length === 0 && (
          <div className="px-4 py-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.32)' }}>
            No contacts yet
          </div>
        )}

        {displayPeople.map((person, i) => {
          const initials =
            person.avatarInitials ??
            person.name
              .split(' ')
              .map((w: string) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()
          const badge = categoryBadge(person.category)

          return (
            <div
              key={person.id}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors"
              style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                style={{
                  background: 'rgba(168,85,247,0.22)',
                  color: '#C084FC',
                  border: '1px solid rgba(168,85,247,0.3)',
                }}
              >
                {initials}
              </div>

              {/* Name + role + company */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-sm font-semibold truncate"
                    style={{ color: 'rgba(255,255,255,0.92)' }}
                  >
                    {person.name}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {person.category ?? 'Contact'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {person.role && (
                    <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {person.role}
                    </span>
                  )}
                  {person.company && (
                    <>
                      {person.role && (
                        <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                      )}
                      <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {person.company}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Phone */}
              {person.phone && (
                <span
                  className="text-xs shrink-0 hidden sm:block"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  {person.phone}
                </span>
              )}

              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2.5"
                className="shrink-0"
              >
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link
          href="/os/contacts/new"
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-center"
          style={{ background: 'linear-gradient(135deg, #A855F7, #6D28D9)', color: 'white' }}
        >
          Add Contact
        </Link>
        <button
          className="px-5 py-3 rounded-xl text-sm font-medium"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.09)',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          Search
        </button>
      </div>
    </div>
  )
}
