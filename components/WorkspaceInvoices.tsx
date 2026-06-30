import { getDb } from '@/lib/db'
import { osInvoices, workItems } from '@/db/schema'
import { inArray, eq } from 'drizzle-orm'
import Link from 'next/link'

export default async function WorkspaceInvoices({ companyName }: { companyName: string }) {
  const db = await getDb()

  const relatedWorkItems = await db
    .select({ id: workItems.id })
    .from(workItems)
    .where(eq(workItems.company, companyName))

  if (relatedWorkItems.length === 0) {
    return <div className="text-xs text-slate-500">No related invoices</div>
  }

  const workItemIds = relatedWorkItems.map(w => w.id)

  const invoices = await db
    .select()
    .from(osInvoices)
    .where(inArray(osInvoices.linkedWorkItemId, workItemIds))
    .limit(10)

  if (invoices.length === 0) {
    return <div className="text-xs text-slate-500">No related invoices</div>
  }

  const statusColor: Record<string, { bg: string; text: string }> = {
    Draft: { bg: 'rgba(61,139,255,0.2)', text: '#3D8BFF' },
    Sent: { bg: 'rgba(255,159,10,0.2)', text: '#FF9F0A' },
    Paid: { bg: 'rgba(40,199,111,0.2)', text: '#28C76F' },
    Overdue: { bg: 'rgba(255,59,48,0.2)', text: '#FF3B30' },
    Cancelled: { bg: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.4)' },
  }

  return (
    <div className="space-y-2">
      {invoices.map((invoice) => {
        const amount = (invoice.amountPence / 100).toFixed(2)
        const colors = statusColor[invoice.status] || statusColor.Draft
        return (
          <Link
            key={invoice.id}
            href={`/os/money/invoices/${invoice.id}`}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <p className="text-xs font-semibold flex-1 truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Invoice {invoice.number}
            </p>
            <p className="text-[9px] font-mono shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>
              £{amount}
            </p>
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: colors.bg, color: colors.text }}
            >
              {invoice.status}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
