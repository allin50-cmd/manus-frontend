import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import AlertRecipientsClient from './AlertRecipientsClient'

export const dynamic = 'force-dynamic'

export default async function AlertRecipientsPage() {
  await requireAuth()

  const recipients = await db.alertRecipient.findMany({
    orderBy: [{ company: 'asc' }, { escalationLevel: 'asc' }, { name: 'asc' }],
  })

  // Group by company
  const byCompany: Record<string, typeof recipients> = {}
  for (const r of recipients) {
    if (!byCompany[r.company]) byCompany[r.company] = []
    byCompany[r.company].push(r)
  }

  const companies = Object.keys(byCompany).sort()

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Alert Recipients</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Who receives compliance alerts per company
          </p>
        </div>
      </div>

      <AlertRecipientsClient byCompany={byCompany} companies={companies} />
    </div>
  )
}
