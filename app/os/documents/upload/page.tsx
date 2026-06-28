'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = ['PendingReview', 'Approved', 'Rejected', 'Archived']
const SOURCES = ['Upload', 'Email', 'Generated']

export default function DocumentUploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [fileMime, setFileMime] = useState('')

  const [form, setForm] = useState({
    status: 'PendingReview',
    source: 'Upload',
    linkedWorkItemId: '',
    linkedCompany: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      setFileSize(file.size)
      setFileMime(file.type)
    } else {
      setFileName('')
      setFileSize(0)
      setFileMime('')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!fileName) {
      setError('Please select a file to upload')
      return
    }

    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/os/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: fileName,
          mimeType: fileMime || undefined,
          fileSizeBytes: fileSize,
          status: form.status,
          source: form.source,
          linkedWorkItemId: form.linkedWorkItemId || undefined,
          linkedCompany: form.linkedCompany || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push('/os/documents')
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

        <div className="grid grid-cols-2 gap-4">
          <Field label="Status">
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Source">
            <select value={form.source} onChange={(e) => set('source', e.target.value)} className={inputClass}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Linked Work Item">
          <input
            value={form.linkedWorkItemId}
            onChange={(e) => set('linkedWorkItemId', e.target.value)}
            placeholder="Work item ID (optional)"
            className={inputClass}
          />
        </Field>

        <Field label="Linked Company">
          <input
            value={form.linkedCompany}
            onChange={(e) => set('linkedCompany', e.target.value)}
            placeholder="Company name or ID (optional)"
            className={inputClass}
          />
        </Field>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !fileName}
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
