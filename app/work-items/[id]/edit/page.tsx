import { requireAuth } from '../../../../lib/auth'
import { db } from '../../../../lib/db'
import { notFound } from 'next/navigation'
import EditForm from './EditForm'

export const dynamic = 'force-dynamic'

export default async function EditWorkItemPage({ params }: { params: { id: string } }) {
  await requireAuth()

  const item = await db.workItem.findUnique({ where: { id: params.id } })
  if (!item) notFound()

  const serialised = {
    id: item.id,
    type: item.type,
    title: item.title,
    company: item.company,
    contactName: item.contactName,
    owner: item.owner,
    status: item.status,
    priority: item.priority,
    nextAction: item.nextAction,
    dueDate: item.dueDate ? item.dueDate.toISOString() : null,
    decisionNeeded: item.decisionNeeded,
    notes: item.notes,
  }

  return <EditForm item={serialised} />
}
