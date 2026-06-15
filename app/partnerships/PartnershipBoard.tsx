'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { stageLabel, stagesForType } from '../../lib/crm-utils'
import type { Decimal } from '@prisma/client/runtime/library'

type PipelineType = 'Partnership' | 'ConstructionLead' | 'PlanningLead'

interface PipelineItem {
  id: string
  title: string
  type: string
  owner: string
  pipelineStage: string | null
  dealValue: Decimal | null
  dueDate: Date | string | null
  daysSinceLastTouch: number | null
  companyRef: { id: string; name: string } | null
  company: string | null
}

function ownerInitials(owner: string): string {
  return owner
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDealValue(val: Decimal | null): string | null {
  if (val === null || val === undefined) return null
  const num = typeof val === 'object' && 'toNumber' in val ? (val as { toNumber(): number }).toNumber() : Number(val)
  if (isNaN(num)) return null
  return `£${num.toLocaleString('en-GB')}`
}

function TouchBadge({ days }: { days: number | null }) {
  if (days === null) {
    return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
        Never
      </span>
    )
  }
  if (days < 7) {
    return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
        {days}d
      </span>
    )
  }
  if (days <= 30) {
    return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
        {days}d
      </span>
    )
  }
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
      {days}d
    </span>
  )
}

const ALL_TYPES: PipelineType[] = ['Partnership', 'ConstructionLead', 'PlanningLead']

export default function PartnershipBoard({
  items: initial,
  activeType,
}: {
  items: PipelineItem[]
  activeType?: PipelineType
}) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null)
  const draggingId = useRef<string | null>(null)
  const draggingOrigStage = useRef<string | null>(null)

  function showToast(message: string, error = false) {
    setToast({ message, error })
    setTimeout(() => setToast(null), 3500)
  }

  // Determine which types to show
  const typesToShow: PipelineType[] = activeType ? [activeType] : ALL_TYPES

  function getStages(type: PipelineType): string[] {
    return stagesForType(type)
  }

  function getItemsForStage(stage: string, type: PipelineType): PipelineItem[] {
    return items.filter((i) => i.pipelineStage === stage && i.type === type)
  }

  function onDragStart(e: React.DragEvent, item: PipelineItem) {
    draggingId.current = item.id
    draggingOrigStage.current = item.pipelineStage
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e: React.DragEvent, stage: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(stage)
  }

  function onDragLeave() {
    setDragOver(null)
  }

  async function onDrop(e: React.DragEvent, stage: string) {
    e.preventDefault()
    setDragOver(null)
    const id = draggingId.current
    const origStage = draggingOrigStage.current
    if (!id || stage === origStage) return

    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, pipelineStage: stage } : item)),
    )

    try {
      const res = await fetch(`/api/partnerships/${id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        // Snap back
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, pipelineStage: origStage } : item)),
        )
        showToast(data.error ?? `Failed to update stage (${res.status})`, true)
        return
      }
      router.refresh()
    } catch {
      // Snap back
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, pipelineStage: origStage } : item)),
      )
      showToast('Network error — stage not saved', true)
    }
  }

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
            toast.error
              ? 'bg-red-600 text-white'
              : 'bg-green-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {typesToShow.map((type) => {
        const stages = getStages(type)
        const typeLabels: Record<PipelineType, string> = {
          Partnership: 'Software Integrations',
          ConstructionLead: 'Construction',
          PlanningLead: 'Planning',
        }
        return (
          <div key={type} className="mb-10">
            {!activeType && (
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">
                {typeLabels[type]}
              </h2>
            )}
            {/* Horizontal scroll on mobile */}
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3" style={{ minWidth: `${stages.length * 220}px` }}>
                {stages.map((stage) => {
                  const stageItems = getItemsForStage(stage, type)
                  const isOver = dragOver === `${type}:${stage}`
                  return (
                    <div
                      key={stage}
                      className={`flex-shrink-0 w-52 rounded-xl transition-colors ${
                        isOver ? 'bg-blue-50 border-2 border-blue-400' : 'bg-slate-100 border-2 border-transparent'
                      }`}
                      onDragOver={(e) => onDragOver(e, `${type}:${stage}`)}
                      onDragLeave={onDragLeave}
                      onDrop={(e) => onDrop(e, stage)}
                    >
                      {/* Column header */}
                      <div className="px-3 py-2 border-b border-slate-200">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-700 truncate">
                            {stageLabel(stage)}
                          </span>
                          <span className="text-[10px] font-bold bg-slate-200 text-slate-600 rounded-full px-2 py-0.5 shrink-0">
                            {stageItems.length}
                          </span>
                        </div>
                      </div>

                      {/* Cards */}
                      <div className="p-2 space-y-2 min-h-[120px]">
                        {stageItems.map((item) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => onDragStart(e, item)}
                            className="bg-white rounded-lg border border-slate-200 px-3 py-2.5 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                            onClick={() => router.push(`/work-items/${item.id}`)}
                          >
                            <p className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2">
                              {item.title}
                            </p>
                            {(item.companyRef?.name ?? item.company) && (
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {item.companyRef?.name ?? item.company}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2 gap-1">
                              <div className="flex items-center gap-1">
                                {/* Owner initials */}
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold shrink-0">
                                  {ownerInitials(item.owner)}
                                </span>
                                {formatDealValue(item.dealValue) && (
                                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                    {formatDealValue(item.dealValue)}
                                  </span>
                                )}
                              </div>
                              <TouchBadge days={item.daysSinceLastTouch} />
                            </div>
                          </div>
                        ))}
                        {stageItems.length === 0 && (
                          <div className="text-[10px] text-slate-400 text-center py-4">
                            Drop here
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}

      {items.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <p className="font-semibold text-slate-700">No pipeline items yet</p>
          <p className="text-sm text-slate-500">
            Create a Work Item with type Partnership, Construction Lead, or Planning Lead to see it here.
          </p>
        </div>
      )}
    </div>
  )
}
