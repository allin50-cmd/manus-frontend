import { requireAuth } from '../../lib/auth'
import { db } from '../../lib/db'
import CopyButton from '../../components/CopyButton'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const TEMPLATE_MAP: Record<string, { type: string; title: string; nextAction: string }> = {
  'EasyEstimate outreach':  { type: 'Partnership',      title: 'EasyEstimate outreach',        nextAction: 'Send soft partnership outreach' },
  'Price A Job outreach':   { type: 'Partnership',      title: 'Price A Job outreach',          nextAction: 'Send soft integration pilot outreach' },
  'Builder outreach':       { type: 'ConstructionLead', title: 'Builder outreach',              nextAction: 'Send builder test message' },
  'Architect outreach':     { type: 'PlanningLead',     title: 'Architect outreach',            nextAction: 'Send architect/planning consultant message' },
  'Merchant outreach':      { type: 'Partnership',      title: 'Merchant pricing partnership',  nextAction: 'Send supplier pricing partnership message' },
  'Handoff to George':      { type: 'InternalTask',     title: 'Handoff to George',             nextAction: 'Prepare decision handoff' },
  'No-go checklist':        { type: 'InternalTask',     title: 'Run no-go checklist',           nextAction: 'Review risks before proceeding' },
}

export default async function TemplatesPage() {
  await requireAuth()

  const templates = await db.template.findMany({
    where: { approved: true },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Templates</h1>
      <p className="text-sm text-slate-500">Approved reusable text. Copy and use.</p>

      <div className="space-y-4">
        {templates.map((t) => {
          const mapping = TEMPLATE_MAP[t.name] ?? { type: 'Other', title: t.name, nextAction: '' }
          const params = new URLSearchParams({ type: mapping.type, title: mapping.title, notes: t.body })
          if (mapping.nextAction) params.set('nextAction', mapping.nextAction)
          const useHref = `/work-items/new?${params.toString()}`

          return (
          <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h2 className="font-semibold text-slate-900">{t.name}</h2>
                <span className="text-xs text-slate-500">{t.useCase}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={useHref}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition-colors"
                >
                  Use template →
                </Link>
                <CopyButton text={t.body} />
              </div>
            </div>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-3 leading-relaxed">
              {t.body}
            </pre>
          </div>
          )
        })}
        {templates.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No templates yet. Run <code className="bg-slate-100 px-1 rounded">npm run db:seed</code> to add defaults.
          </div>
        )}
      </div>
    </div>
  )
}
