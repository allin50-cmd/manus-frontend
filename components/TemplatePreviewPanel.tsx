'use client'

import { useState, useMemo } from 'react'
import { resolveTemplate } from '@/lib/template-utils'

interface Props {
  template: { id: string; name: string; body: string; variables: string[] }
  onClose: () => void
}

const TODAY = new Date()
const TODAY_STR = `${String(TODAY.getDate()).padStart(2, '0')}/${String(TODAY.getMonth() + 1).padStart(2, '0')}/${TODAY.getFullYear()}`

const HINTS: Record<string, string> = {
  company: 'Acme Ltd',
  dueDate: '31/12/2025',
  workItemTitle: 'Annual CT Return',
  recipientName: 'John Smith',
  today: TODAY_STR,
}

function defaultValue(variable: string): string {
  return HINTS[variable] ?? ''
}

export default function TemplatePreviewPanel({ template, onClose }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const v of template.variables) {
      init[v] = defaultValue(v)
    }
    return init
  })
  const [copied, setCopied] = useState(false)

  const resolved = useMemo(
    () => resolveTemplate(template.body, values),
    [template.body, values],
  )

  function setVar(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(resolved)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = resolved
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel — slides in from the right */}
      <div className="relative z-10 flex flex-col w-full max-w-3xl h-full bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 shrink-0">
          <h2 className="font-semibold text-slate-900 text-lg truncate">{template.name}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-2xl leading-none shrink-0"
            aria-label="Close preview"
          >
            ×
          </button>
        </div>

        {/* Body — two-column layout */}
        <div className="flex flex-1 overflow-hidden divide-x divide-slate-200">
          {/* Left: variable inputs */}
          <div className="w-64 shrink-0 overflow-y-auto p-4 space-y-4 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Variables</p>

            {template.variables.length === 0 ? (
              <p className="text-sm text-slate-400">No variables in this template.</p>
            ) : (
              template.variables.map((v) => (
                <div key={v}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {v}
                  </label>
                  <input
                    type="text"
                    value={values[v] ?? ''}
                    onChange={(e) => setVar(v, e.target.value)}
                    placeholder={HINTS[v] ?? v}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))
            )}
          </div>

          {/* Right: resolved preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 shrink-0">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Preview</p>
              <button
                onClick={handleCopy}
                className={`text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copied ? '✓ Copied' : 'Copy resolved text'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                {resolved}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
