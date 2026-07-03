'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import StatusBadge from '@/components/StatusBadge'
 HEAD
import { WORK_ITEM_TRANSITIONS, canTransition } from '@/server/workflow/workflowTransitions'
import type { WorkItemStatus } from '@/lib/types'

function canComplete(status: string): boolean {
  return canTransition(WORK_ITEM_TRANSITIONS, status as WorkItemStatus, 'Completed')
}
=======
import Toast from '@/components/os/workspace/Toast
 feat/ui-design-system

interface WorkItemSummary {
  id: string
  title: string
  status: string
  priority: string
  due_at: string | null
}

interface TaskSummary extends WorkItemSummary {
  work_item_id: string
}

interface DecisionSummary {
  id: string
  title: string
  workItemId: string
  status: string
  createdAt: string
}

interface TeamWorkloadSummary {
  id: string
  name: string
  activeTasksCount: number
  blockedTasksCount: number
}

interface ScheduledItem {
  id: string
  title: string
  due_at: string | null
}

interface TodayData {
  jobsDueToday: WorkItemSummary[]
  overdueWorkItems: WorkItemSummary[]
  blockedTasks: TaskSummary[]
  myTasks: TaskSummary[]
  pendingDecisions: DecisionSummary[]
  scheduledItems: ScheduledItem[]
  teamWorkload: TeamWorkloadSummary[]
}

 HEAD
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onDismiss: () => void }> = ({
  message,
  type,
  onDismiss,
}) => {
  // Depend on `message`, not `onDismiss` — the parent passes a fresh inline
  // closure every render, which would otherwise restart the 3s timer on any
  // unrelated re-render instead of only when a genuinely new toast appears.
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    const timer = setTimeout(() => onDismissRef.current(), 3000)
    return () => clearTimeout(timer)
  }, [message])

  return (
    <div
      className={`fixed bottom-20 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg border shadow-lg text-sm font-medium transition-all ${
        type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      {message}
    </div>
  )
}

=======
 feat/ui-design-system
interface StartJobModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (workItemId: string, notes: string, startTime: string) => Promise<void>
  scheduledItems: ScheduledItem[]
  isLoading: boolean
}

function localNowForInput() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 16)
}

const StartJobModal: React.FC<StartJobModalProps> = ({ isOpen, onClose, onConfirm, scheduledItems, isLoading }) => {
  const [selectedId, setSelectedId] = useState('')
  const [notes, setNotes] = useState('')
  const [startTime, setStartTime] = useState(localNowForInput)
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (isOpen && selectRef.current) {
      setTimeout(() => selectRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setSelectedId('')
      setNotes('')
      setStartTime(localNowForInput())
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (!selectedId) return
    const startTimeISO = startTime ? new Date(startTime).toISOString() : new Date().toISOString()
    onConfirm(selectedId, notes, startTimeISO)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-slate-900">Start Job</h2>

        <div className="space-y-3">
          <Field label="Work Item *">
            <select
              ref={selectRef}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={inputClass}
              disabled={isLoading}
            >
              <option value="">Select a job...</option>
              {scheduledItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} {item.due_at ? `(due ${new Date(item.due_at).toLocaleDateString()})` : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
              rows={2}
              disabled={isLoading}
              placeholder="Any additional notes..."
            />
          </Field>

          <Field label="Start time">
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputClass}
              disabled={isLoading}
            />
          </Field>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors" disabled={isLoading}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Starting...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface CompleteJobModalProps {
  isOpen: boolean
  workItemTitle: string
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}

const CompleteJobModal: React.FC<CompleteJobModalProps> = ({ isOpen, workItemTitle, onConfirm, onCancel, isLoading }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onCancel}>
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold text-slate-900">Complete Job</h2>
        <p className="text-slate-600">
          Are you sure you want to mark <span className="text-slate-900 font-medium">&ldquo;{workItemTitle}&rdquo;</span> as completed?
        </p>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors" disabled={isLoading}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Completing...' : 'Confirm Complete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TodayWorkspace({ initialData }: { initialData: TodayData | null }) {
  const router = useRouter()

  const [isStartModalOpen, setIsStartModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [completingItem, setCompletingItem] = useState<{ id: string; title: string } | null>(null)
  const [completing, setCompleting] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  if (!initialData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-sm text-red-700">
        Could not load today&apos;s workspace. Please refresh the page.
      </div>
    )
  }

  const { jobsDueToday, overdueWorkItems, blockedTasks, myTasks, pendingDecisions, scheduledItems, teamWorkload } =
    initialData

  const kpis = [
    { label: 'Jobs Due Today', count: jobsDueToday.length, color: 'text-blue-600' },
    { label: 'Overdue', count: overdueWorkItems.length, color: 'text-red-600' },
    { label: 'Blocked Tasks', count: blockedTasks.length, color: 'text-amber-600' },
    { label: 'Pending Decisions', count: pendingDecisions.length, color: 'text-purple-600' },
  ]

  async function handleStartJob(workItemId: string, notes: string, startTime: string) {
    setSaving(true)
    try {
      const startedLabel = new Date(startTime).toLocaleString()
      const noteText = notes.trim()
        ? `Job started at ${startedLabel}. ${notes.trim()}`
        : `Job started at ${startedLabel}.`

      const statusRes = await fetch(`/api/work-items/${workItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'InProgress' }),
      })

      if (!statusRes.ok) {
        const d = await statusRes.json().catch(() => ({}))
        setToast({ message: `Failed to start job: ${d.error ?? 'Unknown error'}`, type: 'error' })
        // A rejection (e.g. someone else already changed this item's status)
        // means our view is stale — refresh so the list reflects reality.
        router.refresh()
        return
      }

      let logError = ''
      try {
        const logRes = await fetch(`/api/work-items/${workItemId}/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: noteText }),
        })
        if (!logRes.ok) {
          const d = await logRes.json().catch(() => ({}))
          logError = d.error ?? 'Unknown error'
        }
      } catch {
        logError = 'Network error'
      }

      setIsStartModalOpen(false)
      if (logError) {
        setToast({ message: `Job started, but the note was not saved: ${logError}`, type: 'error' })
      } else {
        setToast({ message: 'Job started successfully!', type: 'success' })
      }
      router.refresh()
    } catch {
      setToast({ message: 'Network error starting job', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleCompleteJob() {
    if (!completingItem) return
    setCompleting(true)
    try {
      const res = await fetch(`/api/work-items/${completingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setToast({ message: `Failed to complete job: ${d.error ?? 'Unknown error'}`, type: 'error' })
        router.refresh()
        return
      }

      setIsCompleteModalOpen(false)
      setCompletingItem(null)
      setToast({ message: 'Job completed successfully!', type: 'success' })
      router.refresh()
    } catch {
      setToast({ message: 'Network error completing job', type: 'error' })
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <h1 className="text-2xl font-bold text-slate-900">Today Workspace</h1>

      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center">
            <span className="text-xs text-slate-500 uppercase tracking-wide">{kpi.label}</span>
            <span className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.count}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        <button
          onClick={() => setIsStartModalOpen(true)}
          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full text-sm text-blue-700 font-medium transition-colors whitespace-nowrap"
        >
          Start Job
        </button>
        <Link
          href="/work-items/new"
          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-sm text-slate-700 font-medium transition-colors whitespace-nowrap"
        >
          Add Task
        </Link>
        <Link
          href="/decisions"
          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-sm text-slate-700 font-medium transition-colors whitespace-nowrap"
        >
          View Decisions
        </Link>
      </div>

      <StartJobModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        onConfirm={handleStartJob}
        scheduledItems={scheduledItems}
        isLoading={saving}
      />

      <CompleteJobModal
        isOpen={isCompleteModalOpen}
        workItemTitle={completingItem?.title ?? ''}
        onConfirm={handleCompleteJob}
        onCancel={() => {
          setIsCompleteModalOpen(false)
          setCompletingItem(null)
        }}
        isLoading={completing}
      />

      <ListSection
        title="Jobs Due Today"
        items={jobsDueToday}
        emptyMessage="No jobs due today"
        renderItem={(item) => (
          <>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">
                {item.priority} &middot; <StatusBadge status={item.status} />
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {item.due_at ? new Date(item.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
              {canComplete(item.status) && (
                <button
                  onClick={() => {
                    setCompletingItem({ id: item.id, title: item.title })
                    setIsCompleteModalOpen(true)
                  }}
                  className="px-2 py-1 bg-green-50 hover:bg-green-100 border border-green-200 rounded text-xs text-green-700 transition-colors"
                >
                  Complete
                </button>
              )}
            </div>
          </>
        )}
      />

      <ListSection
        title="Overdue"
        items={overdueWorkItems}
        emptyMessage="No overdue items"
        renderItem={(item) => (
          <>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-red-700">{item.title}</p>
              <p className="text-xs text-slate-500">
                {item.priority} &middot; <StatusBadge status={item.status} />
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{item.due_at ? new Date(item.due_at).toLocaleDateString() : ''}</span>
              {canComplete(item.status) && (
                <button
                  onClick={() => {
                    setCompletingItem({ id: item.id, title: item.title })
                    setIsCompleteModalOpen(true)
                  }}
                  className="px-2 py-1 bg-green-50 hover:bg-green-100 border border-green-200 rounded text-xs text-green-700 transition-colors"
                >
                  Complete
                </button>
              )}
            </div>
          </>
        )}
      />

      <ListSection
        title="Blocked Tasks"
        items={blockedTasks}
        emptyMessage="No blocked tasks"
        renderItem={(item) => (
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-amber-700">{item.title}</p>
            <Link href={`/work-items/${item.work_item_id}`} className="text-xs text-blue-600 hover:underline">
              Open work item &rarr;
            </Link>
          </div>
        )}
      />

      <ListSection
        title="My Tasks"
        items={myTasks}
        emptyMessage="No tasks assigned to you"
        renderItem={(item) => (
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-slate-900">{item.title}</p>
            <Link href={`/work-items/${item.work_item_id}`} className="text-xs text-blue-600 hover:underline">
              Open work item &rarr;
            </Link>
          </div>
        )}
      />

      <ListSection
        title="Pending Decisions"
        items={pendingDecisions}
        emptyMessage="No pending decisions"
        renderItem={(item) => (
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-slate-900">{item.title}</p>
            <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</p>
          </div>
        )}
      />

      <section>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Team Workload</h3>
        {teamWorkload.length === 0 ? (
          <p className="text-sm text-slate-400">No team members found</p>
        ) : (
          <ul className="space-y-2">
            {teamWorkload.map((member) => (
              <li key={member.id} className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm text-slate-800">{member.name}</span>
                <div className="flex gap-4 text-xs">
                  <span className="text-green-700">Active: {member.activeTasksCount}</span>
                  {member.blockedTasksCount > 0 && <span className="text-amber-700">Blocked: {member.blockedTasksCount}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

interface ListSectionProps<T> {
  title: string
  items: T[]
  renderItem: (item: T) => React.ReactNode
  emptyMessage: string
}

function ListSection<T extends { id: string }>({ title, items, renderItem, emptyMessage }: ListSectionProps<T>) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-2">
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
