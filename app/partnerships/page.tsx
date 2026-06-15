import { requireAuth } from '../../lib/auth'
import { db } from '../../lib/db'
import { daysSinceLastTouch } from '../../lib/crm-utils'
import PartnershipBoard from './PartnershipBoard'
import PartnershipList from './PartnershipList'

export const dynamic = 'force-dynamic'

const PIPELINE_TYPES = ['Partnership', 'ConstructionLead', 'PlanningLead'] as const
type PipelineType = (typeof PIPELINE_TYPES)[number]

const TYPE_LABELS: Record<PipelineType | 'all', string> = {
  all: 'All',
  Partnership: 'Software Integrations',
  ConstructionLead: 'Construction',
  PlanningLead: 'Planning',
}

export default async function PartnershipsPage({
  searchParams,
}: {
  searchParams: { type?: string; view?: string }
}) {
  await requireAuth()

  const typeParam = searchParams.type as PipelineType | undefined
  const view = searchParams.view === 'list' ? 'list' : 'board'

  const filterType =
    typeParam && (PIPELINE_TYPES as readonly string[]).includes(typeParam) ? typeParam : undefined

  let items: Awaited<ReturnType<typeof db.workItem.findMany>> & {
    companyRef: { id: string; name: string } | null
    contactRef: { id: string; name: string; role: string | null; email: string | null; phone: string | null } | null
    outreachLogs: { id: string; occurredAt: Date; followUpDate: Date | null; followUpDone: boolean }[]
    daysSinceLastTouch: number | null
  }[] = []

  try {
    const raw = await db.workItem.findMany({
      where: {
        type: filterType ? filterType : { in: [...PIPELINE_TYPES] },
      },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        companyRef: { select: { id: true, name: true } },
        contactRef: { select: { id: true, name: true, role: true, email: true, phone: true } },
        outreachLogs: {
          orderBy: { occurredAt: 'desc' },
          take: 10,
          select: { id: true, occurredAt: true, followUpDate: true, followUpDone: true },
        },
      },
    })

    items = raw.map((item) => ({
      ...item,
      daysSinceLastTouch: daysSinceLastTouch(item.outreachLogs),
    }))
  } catch {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Pipeline</h1>
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center text-sm text-red-300">
          Could not load pipeline data. Please refresh.
        </div>
      </div>
    )
  }

  const tabs: Array<{ key: string; label: string; href: string }> = [
    { key: 'all', label: 'All', href: `/partnerships${view === 'list' ? '?view=list' : ''}` },
    {
      key: 'Partnership',
      label: 'Software Integrations',
      href: `/partnerships?type=Partnership${view === 'list' ? '&view=list' : ''}`,
    },
    {
      key: 'ConstructionLead',
      label: 'Construction',
      href: `/partnerships?type=ConstructionLead${view === 'list' ? '&view=list' : ''}`,
    },
    {
      key: 'PlanningLead',
      label: 'Planning',
      href: `/partnerships?type=PlanningLead${view === 'list' ? '&view=list' : ''}`,
    },
  ]

  const activeTab = filterType ?? 'all'
  const activeLabel = TYPE_LABELS[activeTab]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipeline</h1>
          <p className="text-slate-500 text-sm mt-0.5">{activeLabel} — {items.length} items</p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <a
            href={`/partnerships${filterType ? `?type=${filterType}` : ''}`}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              view === 'board'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Board
          </a>
          <a
            href={`/partnerships?view=list${filterType ? `&type=${filterType}` : ''}`}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              view === 'list'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            List
          </a>
        </div>
      </div>

      {/* Segmented control */}
      <div className="flex flex-wrap gap-1 bg-slate-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <a
            key={tab.key}
            href={tab.href}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {/* Board or List */}
      {view === 'list' ? (
        <PartnershipList items={items} />
      ) : (
        <PartnershipBoard items={items} activeType={filterType} />
      )}
    </div>
  )
}
