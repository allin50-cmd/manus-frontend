'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type ScanState = 'idle' | 'selected' | 'uploading' | 'success' | 'error'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf']
const MAX_BYTES = 10 * 1024 * 1024

export default function ScanPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<ScanState>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    const ok = ACCEPTED_TYPES.includes(f.type) || /\.(jpg|jpeg|png|heic|pdf)$/i.test(f.name)
    if (!ok) {
      setError('Only JPEG, PNG, HEIC, and PDF files are supported.')
      setState('error')
      return
    }
    if (f.size > MAX_BYTES) {
      setError('File must be under 10 MB.')
      setState('error')
      return
    }
    setFile(f)
    setState('selected')
    setError('')
  }

  async function handleUpload() {
    if (!file) return
    setState('uploading')
    setError('')

    try {
      const res = await fetch('/api/os/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || null,
          fileSizeBytes: file.size,
          source: 'Scan',
          status: 'PendingReview',
        }),
      })

      if (!res.ok) throw new Error('upload failed')
      setState('success')
      if ('vibrate' in navigator) navigator.vibrate([20, 50, 20])
    } catch {
      setState('error')
      setError('Could not upload document. Please try again.')
    }
  }

  if (state === 'success') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 pb-28 lg:pb-0"
        style={{ background: 'linear-gradient(160deg, #050816 0%, #071120 55%, #0B1830 100%)' }}
      >
        <div className="flex flex-col items-center text-center max-w-xs">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
            style={{ background: 'rgba(129,140,248,0.15)', border: '2px solid rgba(129,140,248,0.4)' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'rgba(255,255,255,0.92)' }}>Document Received</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>{file?.name} · Pending review</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => router.push('/os/documents')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(129,140,248,0.15)', color: '#818CF8', border: '1px solid rgba(129,140,248,0.3)' }}
            >
              View in Vault
            </button>
            <button
              onClick={() => { setState('idle'); setFile(null) }}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              Scan Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen pb-28 lg:pb-0"
      style={{ background: 'linear-gradient(160deg, #050816 0%, #071120 55%, #0B1830 100%)' }}
    >
      <div className="max-w-sm mx-auto px-4 pt-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/os')}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Scan</h1>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Upload Document</p>
          </div>
        </div>

        {state === 'error' && (
          <div
            className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)' }}
            role="alert"
          >
            <span style={{ color: '#FF6B6B', fontSize: '1.2em' }} aria-hidden>⚠️</span>
            <div>
              <p className="text-sm font-medium" style={{ color: '#FF6B6B' }}>{error}</p>
              <button onClick={() => setState('idle')} className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Try again
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-2xl flex flex-col items-center justify-center py-14 touch-manipulation"
          style={{
            background: state === 'selected' ? 'rgba(129,140,248,0.1)' : 'rgba(255,255,255,0.03)',
            border: `2px dashed ${state === 'selected' ? 'rgba(129,140,248,0.5)' : 'rgba(255,255,255,0.12)'}`,
            transition: 'all 200ms ease',
          }}
        >
          {state === 'selected' && file ? (
            <>
              <span className="text-4xl mb-3" aria-hidden>📄</span>
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{file.name}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {(file.size / 1024).toFixed(0)} KB · Tap to change
              </p>
            </>
          ) : (
            <>
              <span className="text-4xl mb-3" aria-hidden>📷</span>
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Tap to choose file</p>
              <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>JPEG, PNG, HEIC, PDF · up to 10 MB</p>
            </>
          )}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,.heic,application/pdf,.pdf"
          capture="environment"
          onChange={handleFileChange}
          className="sr-only"
        />

        {state === 'selected' && (
          <button
            onClick={handleUpload}
            className="w-full py-4 rounded-2xl text-base font-bold mt-4"
            style={{
              background: 'linear-gradient(135deg, #818CF8, #6366F1)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(129,140,248,0.4)',
            }}
          >
            Upload Document
          </button>
        )}

        {state === 'uploading' && (
          <div
            className="w-full py-4 rounded-2xl text-base font-bold mt-4 flex items-center justify-center gap-2"
            style={{ background: 'rgba(129,140,248,0.15)', color: '#818CF8', border: '1px solid rgba(129,140,248,0.3)' }}
          >
            <span className="w-4 h-4 rounded-full border-2 border-indigo-400/40 border-t-indigo-400 animate-spin" aria-hidden />
            Uploading…
          </div>
        )}

        <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Documents are stored in VaultLine for review
        </p>
      </div>
    </div>
  )
}
