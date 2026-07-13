'use client'

import { useEffect, useState } from 'react'

interface WorkspaceDocumentsProps {
  companyId: string
  companyName: string
}

interface Document {
  id: string
  fileName: string
  fileType: string
  fileSize: number | null
  storageUrl: string
  category: string | null
  uploadedBy: string
  createdAt: string
}

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
}

function formatSize(bytes: number | null) {
  if (bytes === null) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function WorkspaceDocuments({ companyId, companyName }: WorkspaceDocumentsProps) {
  const [documents, setDocuments] = useState<Document[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError('')
      setDocuments(null)
      try {
        const res = await fetch(`/api/os/documents?companyId=${encodeURIComponent(companyId)}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Failed to load documents')
        }
        const data: Document[] = await res.json()
        if (!cancelled) setDocuments(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load documents')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [companyId])

  if (error) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-xs" style={{ color: 'rgba(255,120,120,0.85)' }}>
          {error}
        </p>
      </div>
    )
  }

  if (documents === null) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Loading documents…
        </p>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          No documents yet for {companyName}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <a
          key={doc.id}
          href={doc.storageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 p-4 rounded-2xl flex-wrap sm:flex-nowrap hover:bg-white/[0.02] transition-colors"
          style={cardStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {doc.fileName}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {doc.category ?? doc.fileType} · {formatDate(doc.createdAt)}
              {formatSize(doc.fileSize) ? ` · ${formatSize(doc.fileSize)}` : ''}
            </p>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            {doc.fileType}
          </span>
        </a>
      ))}
    </div>
  )
}
