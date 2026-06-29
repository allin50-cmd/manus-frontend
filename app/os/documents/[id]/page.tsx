'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface OsDocument {
  id: string
  filename: string
  mimeType: string | null
  fileSizeBytes: number | null
  storagePath: string | null
  source: string
  status: string
  linkedWorkItemId: string | null
  linkedCompany: string | null
  uploadedBy: string
  createdAt: string
  updatedAt: string
}

const STATUS_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  PendingReview: { bg: 'rgba(255,159,10,0.15)', text: '#FF9F0A', border: 'rgba(255,159,10,0.25)' },
  Approved: { bg: 'rgba(40,199,111,0.15)', text: '#28C76F', border: 'rgba(40,199,111,0.25)' },
  Rejected: { bg: 'rgba(255,59,48,0.15)', text: '#FF3B30', border: 'rgba(255,59,48,0.25)' },
  Archived: { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)' },
}

export default function DocumentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const docId = params.id as string

  const [doc, setDoc] = useState<OsDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDocument()
  }, [docId])

  async function fetchDocument() {
    try {
      setLoading(true)
      const res = await fetch(`/api/os/documents/${docId}`)
      if (res.ok) {
        const data = await res.json()
        setDoc(data)
      } else {
        setError('Document not found')
      }
    } catch (err) {
      setError('Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  function formatBytes(bytes: number | null) {
    if (!bytes) return '—'
    if (bytes > 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
    if (bytes > 1024) return `${Math.round(bytes / 1024)} KB`
    return `${bytes} B`
  }

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return '📄'
    if (mimeType.includes('pdf')) return '📕'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('sheet')) return '📊'
    if (mimeType.includes('presentation')) return '📈'
    return '📄'
  }

  if (loading) {
    return <div className="text-center py-8">Loading document…</div>
  }

  if (!doc) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="mb-4 text-sm font-medium hover:opacity-75">
          ← Back
        </button>
        <div className="text-center py-8 text-red-600">Document not found</div>
      </div>
    )
  }

  const statusColors = STATUS_COLOR[doc.status] ?? STATUS_COLOR.Archived

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => router.back()} className="mb-3 text-sm font-medium hover:opacity-75">
            ← Back
          </button>
          <div className="flex items-start gap-4">
            <div className="text-5xl">{getFileIcon(doc.mimeType)}</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{doc.filename}</h1>
              <p className="text-sm text-slate-500 mt-1">{doc.mimeType || 'Unknown type'}</p>
            </div>
          </div>
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs font-semibold shrink-0"
          style={{
            background: statusColors.bg,
            color: statusColors.text,
            border: `1px solid ${statusColors.border}`,
          }}
        >
          {doc.status === 'PendingReview' ? 'Review' : doc.status}
        </div>
      </div>

      {/* Document info card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">File Size</p>
          <p className="text-sm text-slate-900">{formatBytes(doc.fileSizeBytes)}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Source</p>
          <p className="text-sm text-slate-900">{doc.source}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Uploaded By</p>
          <p className="text-sm text-slate-900">{doc.uploadedBy}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Uploaded</p>
          <p className="text-sm text-slate-900">{new Date(doc.createdAt).toLocaleString('en-GB')}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Last Modified</p>
          <p className="text-sm text-slate-900">{new Date(doc.updatedAt).toLocaleString('en-GB')}</p>
        </div>

        {doc.linkedCompany && (
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Company</p>
            <p className="text-sm text-slate-900">{doc.linkedCompany}</p>
          </div>
        )}

        {doc.linkedWorkItemId && (
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Linked Work Item</p>
            <Link href={`/os/work-items/${doc.linkedWorkItemId}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              {doc.linkedWorkItemId} →
            </Link>
          </div>
        )}

        {doc.storagePath && (
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Storage Path</p>
            <p className="text-xs font-mono text-slate-500 break-all bg-slate-50 p-2 rounded">{doc.storagePath}</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <Link
          href="/os/documents"
          className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-center text-sm"
        >
          Back to Documents
        </Link>
      </div>
    </div>
  )
}
