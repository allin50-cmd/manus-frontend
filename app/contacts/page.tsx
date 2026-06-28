import { requireAuth } from '../../lib/auth'
import { db } from '../../lib/db'
import ContactsClient from './ContactsClient'

export default async function ContactsPage() {
  await requireAuth()

  let contacts: any[] = []
  let companies: any[] = []
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
