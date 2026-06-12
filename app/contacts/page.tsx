import { requireAuth } from '../../lib/auth'
import { db } from '../../lib/db'
import ContactsClient from './ContactsClient'

export default async function ContactsPage() {
  await requireAuth()

  let contacts: Awaited<ReturnType<typeof db.contact.findMany<{ include: { company: true } }>>> = []
  let companies: Awaited<ReturnType<typeof db.company.findMany>> = []
  try {
    ;[contacts, companies] = await Promise.all([
      db.contact.findMany({
        where: { isActive: true },
        include: { company: true },
        orderBy: [{ company: { name: 'asc' } }, { isPrimary: 'desc' }, { name: 'asc' }],
        take: 500,
      }),
      db.company.findMany({ orderBy: { name: 'asc' }, take: 500 }),
    ])
  } catch {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
        Could not load contacts. Please refresh the page.
      </div>
    )
  }

  return <ContactsClient contacts={contacts} companies={companies} />
}
