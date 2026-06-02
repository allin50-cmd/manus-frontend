'use client'

import { useState } from 'react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for older Safari / insecure contexts
      const ta = document.createElement('textarea')
      ta.value = text
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
    <button
      onClick={handleCopy}
      className={`text-xs font-medium rounded px-3 py-1.5 transition-colors shrink-0 ${
        copied
          ? 'bg-green-100 text-green-700'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}
