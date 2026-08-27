'use client'

import { useState } from 'react'
import { buildParsedCommandJob, queueParsedCommandJob } from '@/lib/parsed-command-jobs'

type ParsedCommand = {
  action: string
  confidence: number
  needs_confirmation: boolean
  missing_fields: string[]
}

export default function GlobalCommandInput() {
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ParsedCommand | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function parseCommand() {
    const input = text.trim()
    if (!input) return

    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/parse-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Could not parse command.')
      setParsed(data)

      const job = buildParsedCommandJob(data, input)
      if (job) {
        queueParsedCommandJob(job)
        setMessage('Saved to Today workspace.')
        setText('')
      } else {
        setMessage('Parsed. Review required before saving.')
      }
    } catch (err) {
      setParsed(null)
      setError(err instanceof Error ? err.message : 'Could not parse command.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') parseCommand()
          }}
          placeholder="Type a command for UltraTech OS"
          className="min-h-11 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-400/60"
        />
        <button
          type="button"
          onClick={parseCommand}
          disabled={isLoading || !text.trim()}
          className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Parsing…' : 'Parse'}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-cyan-200">{message}</p> : null}

      {parsed ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-white/50">Action</p>
            <p className="mt-1 text-sm font-semibold text-white">{parsed.action.replace(/_/g, ' ')}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-white/50">Status</p>
            <p className="mt-1 text-sm font-semibold text-white">{parsed.needs_confirmation ? 'Needs confirmation' : 'Ready'}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-white/50">Confidence</p>
            <p className="mt-1 text-sm font-semibold text-white">{Math.round(parsed.confidence * 100)}%</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
