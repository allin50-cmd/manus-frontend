import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import NewAlertForm from './NewAlertForm'

export const dynamic = 'force-dynamic'

export default async function NewAlertPage() {
  await requireAuth()

  const recipients = await db.alertRecipient.findMany({
    where: { isActive: true },
    select: { company: true },
    distinct: ['company'],
    orderBy: { company: 'asc' },
  })

  const companies = recipients.map((r) => r.company)

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <Link href="/alerts" className="text-slate-400 hover:text-slate-600 text-sm">
          ← Compliance Alerts
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">New Compliance Alert</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Creates a work item and dispatches to configured recipients
        </p>
      </div>

      <NewAlertForm companies={companies} />
    </div>
  )
}
