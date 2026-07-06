'use client'

import { useMemo, useState } from 'react'

type ParseResult = {
  action: string
  title?: string
  message?: string
  person?: string
  participants?: string[]
  amount?: number
  currency?: string
  date?: string
  time?: string
  confidence: number
  needs_confirmation: boolean
  missing_fields: string[]
  raw_text: string
}

type HistoryItem = {
  input: string
  result: ParseResult
}

const EXAMPLES = [
  'Remind me tomorrow at 2pm to call Dagon about FineGuard.',
  'Create a task for Michelle to chase the Accuracy quote tomorrow morning.',
  'Draft an email to Shakeel saying Thursday at 3pm works.',
  'Create an invoice for £450 for website updates.',
  'Book a callback with Chris next Friday at 10am.',
  'Schedule a meeting with Chris and Dagon next Tuesday at 11am about FineGuard.',
  'Ping Sarah about the contract.',
]

function formatConfidence(confidence?: number) {
  if (typeof confidence !== 'number') return '—'
  return `${Math.round(confidence * 100)}%`
}

export default function ParserPlayground() {
  const [text, setText] = useState(EXAMPLES[5])
  const [result, setResult] = useState<ParseResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const statusLabel = useMemo(() => {
    if (!result) return 'Waiting for input'
    return result.needs_confirmation ? 'Needs confirmation' : 'Ready to execute'
  }, [result])

  async function handleParse() {
    const trimmed = text.trim()
    if (!trimmed) {
      setError('Enter a command to parse.')
      setResult(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/parse-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Parser request failed.')
      }

      setResult(data)
      setHistory((current) => [{ input: trimmed, result: data }, ...current].slice(0, 8))
    } catch (parseError) {
      setResult(null)
      setError(parseError instanceof Error ? parseError.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Universal Action Parser</h2>
            <p className="mt-1 text-sm text-white/60">
              Test natural-language commands before wiring them into real execution.
            </p>
          </div>

          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
            {statusLabel}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="min-h-32 w-full rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none ring-0 placeholder:text-white/30 focus:border-cyan-400/60"
            placeholder="Example: Schedule a meeting with Chris and Dagon next Tuesday at 11am about FineGuard."
          />

          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setText(example)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60 hover:border-cyan-400/60 hover:text-white"
              >
                {example.slice(0, 42)}{example.length > 42 ? '…' : ''}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleParse}
            disabled={isLoading}
            className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Parsing…' : 'Parse command'}
          </button>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-white/50">Action</p>
          <p className="mt-2 text-2xl font-semibold text-white">{result?.action || '—'}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-white/50">Confidence</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatConfidence(result?.confidence)}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-white/50">Missing fields</p>
          <p className="mt-2 text-sm text-white">
            {result?.missing_fields?.length ? result.missing_fields.join(', ') : 'None'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold text-white">Parsed JSON</h3>
          <pre className="mt-4 max-h-[520px] overflow-auto rounded-xl bg-black/40 p-4 text-xs text-cyan-100">
            {result ? JSON.stringify(result, null, 2) : 'No result yet.'}
          </pre>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold text-white">Recent parses</h3>
          <div className="mt-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-white/50">Parsed commands will appear here.</p>
            ) : (
              history.map((item, index) => (
                <button
                  key={`${item.input}-${index}`}
                  type="button"
                  onClick={() => {
                    setText(item.input)
                    setResult(item.result)
                  }}
                  className="w-full rounded-xl border border-white/10 p-3 text-left hover:border-cyan-400/50"
                >
                  <p className="text-sm text-white">{item.input}</p>
                  <p className="mt-1 text-xs text-white/50">
                    {item.result.action} · {formatConfidence(item.result.confidence)} · {item.result.needs_confirmation ? 'confirm' : 'ready'}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
