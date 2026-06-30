'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function DocumentUploadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = searchParams.get('companyId')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [fileType, setFileType] = useState('')

  const [form, setForm] = useState({
    uploadedBy: '',
    storageUrl: '',
    category: '',
    tags: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      setFileSize(file.size)
      setFileType(file.type)
    } else {
      setFileName('')
      setFileSize(0)
      setFileType('')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!companyId) {
      setError('Company context is required')
      return
    }
    if (!fileName) {
      setError('Please select a file')
      return
    }
    if (!form.uploadedBy.trim()) {
      setError('Uploaded by is required')
      return
    }
    if (!form.storageUrl.trim()) {
      setError('Storage URL is required')
      return
    }

    setError('')
    setLoading(true)
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      const res = await fetch('/api/os/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          fileName,
          fileType: fileType || 'application/octet-stream',
          fileSize: fileSize > 0 ? fileSize : undefined,
          storageUrl: form.storageUrl,
          category: form.category || undefined,
          tags: tags.length > 0 ? tags : undefined,
          uploadedBy: form.uploadedBy,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/os/documents?companyId=${companyId}`)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to upload document')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!companyId) {
    return (
      <div className="max-w-lg space-y-6">
        <h1 className="text-xl font-bold text-slate-900">Upload Document</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
          <p>Please access this form from a workspace context with a company ID.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-slate-900">Upload Document</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <Field label="File *">
          <div className="relative">
            <input
              type="file"
              onChange={handleFileChange}
              className={`${inputClass} file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
            />
            {fileName && (
              <p className="text-xs text-slate-500 mt-2">
                {fileName} ({(fileSize / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
        </Field>

        <Field label="Uploaded By *">
          <input
            required
            value={form.uploadedBy}
            onChange={(e) => set('uploadedBy', e.target.value)}
            placeholder="Your name or user ID"
            className={inputClass}
          />
        </Field>

        <Field label="Storage URL *">
          <input
            required
            value={form.storageUrl}
            onChange={(e) => set('storageUrl', e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </Field>

        <Field label="Category">
          <input
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="e.g., Contract, Invoice, Report (optional)"
            className={inputClass}
          />
        </Field>

        <Field label="Tags">
          <input
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder="Comma-separated tags (optional)"
            className={inputClass}
          />
        </Field>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !fileName || !form.uploadedBy || !form.storageUrl}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Uploading…' : 'Upload Document'}
        </button>
      </form>
    </div>
  )
}

const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}
