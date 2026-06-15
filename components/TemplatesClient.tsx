'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CopyButton from '@/components/CopyButton'
import TemplatePreviewPanel from '@/components/TemplatePreviewPanel'

export type TemplateRow = {
  id: string
  name: string
  useCase: string
  body: string
  approved: boolean
  pendingReview: boolean
  reviewNote: string | null
  approvedBy: string | null
  approvedAt: Date | string | null
  category: string
  variables: string[]
}

interface Props {
  templates: TemplateRow[]
  person: string
  templateMap: Record<string, { type: string; title: string; nextAction: string }>
}

type StatusLabel = 'Approved' | 'Pending Review' | 'Rejected' | 'Draft'

function getStatus(t: TemplateRow): StatusLabel {
  if (t.approved) return 'Approved'
  if (t.pendingReview) return 'Pending Review'
  if (t.reviewNote && !t.approved && !t.pendingReview) return 'Rejected'
  return 'Draft'
}

const STATUS_BADGE: Record<StatusLabel, string> = {
  Approved: 'bg-green-100 text-green-700',
  'Pending Review': 'bg-amber-100 text-amber-700',
  Rejected: 'bg-red-100 text-red-700',
  Draft: 'bg-slate-100 text-slate-500',
}

const CATEGORY_BADGE = 'bg-indigo-50 text-indigo-700'

const ALL_CATEGORIES = ['All', 'ComplianceAlert', 'FollowUp', 'ClientCommunication', 'InternalNote', 'StatusUpdate', 'General'] as const

export default function TemplatesClient({ templates, person, templateMap }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [previewTemplate, setPreviewTemplate] = useState<TemplateRow | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('All')

  const isGeorge = person === 'George'

  const filtered = categoryFilter === 'All'
    ? templates
    : templates.filter((t) => t.category === categoryFilter)

  async function handleSubmit(id: string) {
    setBusy(id + ':submit')
    try {
      await fetch(`/api/templates/${id}/submit`, { method: 'POST' })
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  async function handleApprove(id: string) {
    setBusy(id + ':approve')
    try {
      await fetch(`/api/templates/${id}/approve`, { method: 'POST' })
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  async function handleReject(id: string) {
    setBusy(id + ':reject')
    try {
      await fetch(`/api/templates/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: rejectNote }),
      })
      setRejectId(null)
      setRejectNote('')
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Category:</span>
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`text-xs font-medium rounded-full px-3 py-1 transition-colors border ${
              categoryFilter === cat
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template list */}
      <div className="space-y-4">
        {filtered.map((t) => {
          const status = getStatus(t)
          const mapping = templateMap[t.name] ?? { type: 'Other', title: t.name, nextAction: '' }
          const params = new URLSearchParams({ type: mapping.type, title: mapping.title, notes: t.body })
          if (mapping.nextAction) params.set('nextAction', mapping.nextAction)
          const useHref = `/work-items/new?${params.toString()}`

          return (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-slate-900">{t.name}</h2>
                    {/* Category badge */}
                    <span className={`text-xs font-medium rounded px-2 py-0.5 ${CATEGORY_BADGE}`}>
                      {t.category}
                    </span>
                    {/* Status badge */}
                    <span className={`text-xs font-medium rounded px-2 py-0.5 ${STATUS_BADGE[status]}`}>
                      {status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{t.useCase}</span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {/* Eye / preview button */}
                  <button
                    onClick={() => setPreviewTemplate(t)}
                    title="Preview template"
                    className="text-slate-400 hover:text-slate-700 text-lg leading-none px-1.5 py-1"
                    aria-label="Preview template"
                  >
                    👁️
                  </button>

                  {/* Draft: show Request Approval */}
                  {status === 'Draft' && (
                    <button
                      onClick={() => handleSubmit(t.id)}
                      disabled={busy === t.id + ':submit'}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-900 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                    >
                      {busy === t.id + ':submit' ? 'Submitting…' : 'Request Approval'}
                    </button>
                  )}

                  {/* Pending: George sees Approve / Reject */}
                  {status === 'Pending Review' && isGeorge && (
                    <>
                      <button
                        onClick={() => handleApprove(t.id)}
                        disabled={busy === t.id + ':approve'}
                        className="text-xs font-semibold text-green-700 hover:text-green-900 border border-green-200 bg-green-50 hover:bg-green-100 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                      >
                        {busy === t.id + ':approve' ? 'Approving…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => { setRejectId(t.id); setRejectNote('') }}
                        className="text-xs font-semibold text-red-700 hover:text-red-900 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {/* Approved: show Use template + Copy */}
                  {status === 'Approved' && (
                    <>
                      <Link
                        href={useHref}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        Use template →
                      </Link>
                      <CopyButton text={t.body} />
                    </>
                  )}
                </div>
              </div>

              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-3 leading-relaxed">
                {t.body}
              </pre>

              {/* Rejected: show review note */}
              {status === 'Rejected' && t.reviewNote && (
                <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
                  <span className="font-semibold">Rejection note: </span>
                  {t.reviewNote}
                </div>
              )}

              {/* Inline reject form */}
              {rejectId === t.id && (
                <div className="mt-3 space-y-2">
                  <textarea
                    autoFocus
                    rows={2}
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Reason for rejection (optional)…"
                    className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(t.id)}
                      disabled={busy === t.id + ':reject'}
                      className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-4 py-1.5 transition-colors disabled:opacity-50"
                    >
                      {busy === t.id + ':reject' ? 'Rejecting…' : 'Confirm Reject'}
                    </button>
                    <button
                      onClick={() => setRejectId(null)}
                      className="text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg px-4 py-1.5 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            {categoryFilter === 'All'
              ? 'No templates yet.'
              : `No templates in category "${categoryFilter}".`}
          </div>
        )}
      </div>

      {/* Preview slide-over */}
      {previewTemplate && (
        <TemplatePreviewPanel
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </>
  )
}
