import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import ContactsClient from './ContactsClient'

export default async function ContactsPage() {
  await requireAuth()

  const [contacts, companies] = await Promise.all([
    db.contact.findMany({
      where: { isActive: true },
      include: { company: true },
      orderBy: [{ company: { name: 'asc' } }, { isPrimary: 'desc' }, { name: 'asc' }],
    }),
    db.company.findMany({ orderBy: { name: 'asc' } }),
  ])

  return <ContactsClient contacts={contacts} companies={companies} />
}
