import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

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
        {templates.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h2 className="font-semibold text-slate-900">{t.name}</h2>
                <span className="text-xs text-slate-500">{t.useCase}</span>
              </div>
              <CopyButton text={t.body} />
            </div>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-3 leading-relaxed">
              {t.body}
            </pre>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No templates yet. Run <code className="bg-slate-100 px-1 rounded">npm run db:seed</code> to add defaults.
          </div>
        )}
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  // Client component for copy functionality would go here.
  // For MVP, render a static label — copy is done manually.
  return (
    <span className="text-xs bg-slate-100 text-slate-500 rounded px-2 py-1">Copy manually</span>
  )
}
