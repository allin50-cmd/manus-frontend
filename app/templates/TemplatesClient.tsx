'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import CopyButton from '@/components/CopyButton'
import { TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/template-enums'

export type TemplateRow = {
  id: string
  name: string
  useCase: string
  body: string
  approved: boolean
  pendingReview: boolean
  reviewNote: string | null
  approvedBy: string | null
  approvedAt: string | null
  category: TemplateCategory
}

interface Props {
  templates: TemplateRow[]
  person: string
  templateMap: Record<string, { type: string; title: string; nextAction: string }>
}

type StatusLabel = 'Approved' | 'Pending Review' | 'Rejected' | 'Draft'
type ReviewAction = 'submit' | 'approve' | 'reject'

const STATUS_BADGE: Record<StatusLabel, string> = {
  Approved: 'bg-green-100 text-green-700',
  'Pending Review': 'bg-amber-100 text-amber-700',
  Rejected: 'bg-red-100 text-red-700',
  Draft: 'bg-slate-100 text-slate-600',
}

function getStatus(template: TemplateRow): StatusLabel {
  if (template.approved) return 'Approved'
  if (template.pendingReview) return 'Pending Review'
  if (template.reviewNote) return 'Rejected'
  return 'Draft'
}

function approvalSummary(template: TemplateRow): string | null {
  if (!template.approved || !template.approvedBy) return null
  if (!template.approvedAt) return `Approved by ${template.approvedBy}`

  const date = new Date(template.approvedAt)
  if (Number.isNaN(date.getTime())) return `Approved by ${template.approvedBy}`

  return `Approved by ${template.approvedBy} on ${date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}`
}

export default function TemplatesClient({ templates, person, templateMap }: Props) {
  const router = useRouter()
  const [categoryFilter, setCategoryFilter] = useState<'All' | TemplateCategory>('All')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const isGeorge = person === 'George'
  const categories = ['All', ...TEMPLATE_CATEGORIES] as const
  const filtered = categoryFilter === 'All'
    ? templates
    : templates.filter((template) => template.category === categoryFilter)

  async function runAction(id: string, action: ReviewAction, body?: unknown) {
    const busyKey = `${id}:${action}`
    setBusy(busyKey)
    setError(null)

    try {
      const res = await fetch(`/api/templates/${id}/${action}`, {
        method: 'POST',
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? `Could not ${action} template`)
        return false
      }

      router.refresh()
      return true
    } catch {
      setError('Network error')
      return false
    } finally {
      setBusy(null)
    }
  }

  async function handleReject(id: string) {
    const succeeded = await runAction(id, 'reject', { note: rejectNote })
    if (succeeded) {
      setRejectId(null)
      setRejectNote('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Category:</span>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setCategoryFilter(category)}
            aria-pressed={categoryFilter === category}
            className={`text-xs font-medium rounded-full px-3 py-1 transition-colors border ${
              categoryFilter === category
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((template) => {
          const status = getStatus(template)
          const mapping = templateMap[template.name] ?? {
            type: 'Other',
            title: template.name,
            nextAction: '',
          }
          const params = new URLSearchParams({
            type: mapping.type,
            title: mapping.title,
            notes: template.body,
          })
          if (mapping.nextAction) params.set('nextAction', mapping.nextAction)
          const useHref = `/work-items/new?${params.toString()}`
          const approval = approvalSummary(template)
          const submitBusy = busy === `${template.id}:submit`
          const approveBusy = busy === `${template.id}:approve`
          const rejectBusy = busy === `${template.id}:reject`

          return (
            <article key={template.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-slate-900">{template.name}</h2>
                    <span className="text-xs font-medium rounded px-2 py-0.5 bg-indigo-50 text-indigo-700">
                      {template.category}
                    </span>
                    <span className={`text-xs font-medium rounded px-2 py-0.5 ${STATUS_BADGE[status]}`}>
                      {status}
                    </span>
                  </div>
                  {template.useCase && <p className="text-xs text-slate-500 mt-1">{template.useCase}</p>}
                  {approval && <p className="text-xs text-green-700 mt-1">{approval}</p>}
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {(status === 'Draft' || status === 'Rejected') && (
                    <button
                      type="button"
                      onClick={() => runAction(template.id, 'submit')}
                      disabled={submitBusy}
                      className="text-xs font-semibold text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                    >
                      {submitBusy ? 'Submitting…' : 'Request Approval'}
                    </button>
                  )}

                  {status === 'Pending Review' && isGeorge && (
                    <>
                      <button
                        type="button"
                        onClick={() => runAction(template.id, 'approve')}
                        disabled={approveBusy}
                        className="text-xs font-semibold text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                      >
                        {approveBusy ? 'Approving…' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectId(template.id)
                          setRejectNote('')
                        }}
                        disabled={rejectBusy}
                        className="text-xs font-semibold text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {status === 'Pending Review' && !isGeorge && (
                    <span className="text-xs font-medium text-amber-700">Awaiting George review</span>
                  )}

                  {status === 'Approved' && (
                    <>
                      <Link
                        href={useHref}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        Use template →
                      </Link>
                      <CopyButton text={template.body} />
                    </>
                  )}
                </div>
              </div>

              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-3 leading-relaxed">
                {template.body}
              </pre>

              {status === 'Rejected' && template.reviewNote && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
                  <span className="font-semibold">Rejection note: </span>
                  {template.reviewNote}
                </div>
              )}

              {rejectId === template.id && (
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <label htmlFor={`reject-note-${template.id}`} className="block text-xs font-semibold text-slate-600">
                    Rejection note (optional)
                  </label>
                  <textarea
                    id={`reject-note-${template.id}`}
                    rows={2}
                    maxLength={1000}
                    value={rejectNote}
                    onChange={(event) => setRejectNote(event.target.value)}
                    placeholder="Explain what should change before resubmission"
                    className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleReject(template.id)}
                      disabled={rejectBusy}
                      className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-4 py-1.5 transition-colors disabled:opacity-50"
                    >
                      {rejectBusy ? 'Rejecting…' : 'Confirm Reject'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectId(null)
                        setRejectNote('')
                      }}
                      disabled={rejectBusy}
                      className="text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg px-4 py-1.5 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </article>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            {categoryFilter === 'All'
              ? 'No templates yet.'
              : `No templates in category “${categoryFilter}”.`}
          </div>
        )}
      </div>
    </div>
  )
}
