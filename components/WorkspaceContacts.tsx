import { getDb } from '@/lib/db'
import { osPeople } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

export default async function WorkspaceContacts({ companyName }: { companyName: string }) {
  const db = await getDb()

  const contacts = await db
    .select()
    .from(osPeople)
    .where(eq(osPeople.company, companyName))
    .limit(10)

  if (contacts.length === 0) {
    return <div className="text-xs text-slate-500">No related contacts</div>
  }

  return (
    <div className="space-y-2">
      {contacts.map((contact) => (
        <Link
          key={contact.id}
          href={`/os/contacts/${contact.id}`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{
              background: 'rgba(168,85,247,0.22)',
              color: '#C084FC',
              border: '1px solid rgba(168,85,247,0.3)',
            }}
          >
            {contact.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>{contact.name}</p>
            {contact.email && <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{contact.email}</p>}
          </div>
        </Link>
      ))}
    </div>
  )
}
