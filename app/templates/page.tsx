import { requireAuth } from '../../lib/auth'
import { db } from '../../lib/db'
import AddTemplateForm from './AddTemplateForm'
import TemplatesClient from './TemplatesClient'

export const dynamic = 'force-dynamic'

const TEMPLATE_MAP: Record<string, { type: string; title: string; nextAction: string }> = {
  'EasyEstimate outreach': { type: 'Partnership', title: 'EasyEstimate outreach', nextAction: 'Send soft partnership outreach' },
  'Price A Job outreach': { type: 'Partnership', title: 'Price A Job outreach', nextAction: 'Send soft integration pilot outreach' },
  'Builder outreach': { type: 'ConstructionLead', title: 'Builder outreach', nextAction: 'Send builder test message' },
  'Architect outreach': { type: 'PlanningLead', title: 'Architect outreach', nextAction: 'Send architect/planning consultant message' },
  'Merchant outreach': { type: 'Partnership', title: 'Merchant pricing partnership', nextAction: 'Send supplier pricing partnership message' },
  'Handoff to George': { type: 'InternalTask', title: 'Handoff to George', nextAction: 'Prepare decision handoff' },
  'No-go checklist': { type: 'InternalTask', title: 'Run no-go checklist', nextAction: 'Review risks before proceeding' },
}

export default async function TemplatesPage() {
  const session = await requireAuth()

  const templates = await db.template.findMany({
    orderBy: { createdAt: 'asc' },
  })

  const rows = templates.map((template) => ({
    id: template.id,
    name: template.name,
    useCase: template.useCase,
    body: template.body,
    approved: template.approved,
    pendingReview: template.pendingReview,
    reviewNote: template.reviewNote,
    approvedBy: template.approvedBy,
    approvedAt: template.approvedAt?.toISOString() ?? null,
    category: template.category,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Templates</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Reusable text with review control. Only approved templates can be copied or used.
          </p>
        </div>
        <AddTemplateForm />
      </div>

      <TemplatesClient
        templates={rows}
        person={session.person}
        templateMap={TEMPLATE_MAP}
      />
    </div>
  )
}
