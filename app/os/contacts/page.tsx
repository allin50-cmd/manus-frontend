import { getDb } from '@/lib/db'
import { osPeople } from '@/db/schema'
import { eq, sql, asc } from 'drizzle-orm'

const CATEGORY_COLORS: Record<string, string> = {
  Team: 'bg-purple-100 text-purple-700',
  Client: 'bg-blue-100 text-blue-700',
  Partner: 'bg-green-100 text-green-700',
  Supplier: 'bg-amber-100 text-amber-700',
  Prospect: 'bg-pink-100 text-pink-700',
}

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const db = await getDb()

  const [people, counts] = await Promise.all([
    db.select().from(osPeople).orderBy(asc(osPeople.category), asc(osPeople.name)).limit(50),
    db
      .select({
        category: osPeople.category,
        count: sql<number>`count(*)`,
      })
      .from(osPeople)
      .groupBy(osPeople.category),
  ])

  const countMap: Record<string, number> = {}
  counts.forEach((c) => { countMap[c.category] = Number(c.count) })

  const grouped: Record<string, typeof people> = {}
  for (const p of people) {
    grouped[p.category] = grouped[p.category] ?? []
    grouped[p.category].push(p)
  }

  const CATEGORY_ORDER = ['Team', 'Client', 'Partner', 'Supplier', 'Prospect']

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #C47BFF, #7A1ABF)' }}
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-slate-500 text-sm">{people.length} people</p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {CATEGORY_ORDER.map((cat) => (
          <div key={cat} className="bg-white rounded-xl border border-slate-100 p-3 text-center">
            <div className="text-xl font-bold text-slate-800">{countMap[cat] ?? 0}</div>
            <div className="text-xs text-slate-500 mt-0.5">{cat}s</div>
          </div>
        ))}
      </div>

      {people.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
          No contacts yet
        </div>
      ) : (
        CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
          <div key={cat}>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{cat}s</h2>
            <div className="space-y-2">
              {grouped[cat].map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                    {p.avatarInitials ?? p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm">{p.name}</div>
                    <div className="text-xs text-slate-400 truncate">{p.role ?? p.company ?? '—'}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {p.phone && (
                      <a href={`tel:${p.phone}`} className="text-xs text-blue-600 hover:underline">{p.phone}</a>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[p.category] ?? 'bg-slate-100 text-slate-600'}`}>
                      {p.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
