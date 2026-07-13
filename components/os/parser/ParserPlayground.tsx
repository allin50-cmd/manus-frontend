'use client'

import { useMemo, useState } from 'react'
import type { ParsedAction } from '@/lib/action-parser'
import { commandCorpus } from '@/lib/action-parser/commandCorpus'
import { getExecutionPreview } from '@/lib/action-parser/executionPreview'

type HistoryItem = {
  input: string
  result: ParsedAction
}

const EXAMPLES = commandCorpus.slice(0, 12)

function formatConfidence(confidence?: number) {
  if (typeof confidence !== 'number') return '—'
  return `${Math.round(confidence * 100)}%`
}

export default function ParserPlayground() {
  const [text, setText] = useState(EXAMPLES[12]?.input || EXAMPLES[0]?.input || '')
  const [result, setResult] = useState<ParsedAction | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedArea, setSelectedArea] = useState('All')
  const [executionMessage, setExecutionMessage] = useState<string | null>(null)

  const statusLabel = useMemo(() => {
    if (!result) return 'Waiting for input'
    return result.needs_confirmation ? 'Needs confirmation' : 'Ready to execute'
  }, [result])

  const areas = useMemo(() => ['All', ...Array.from(new Set(commandCorpus.map((entry) => entry.area)))], [])
  const filteredExamples = useMemo(() => {
    return selectedArea === 'All'
      ? commandCorpus
      : commandCorpus.filter((entry) => entry.area === selectedArea)
  }, [selectedArea])

  const preview = useMemo(() => getExecutionPreview(result), [result])

  async function handleParse() {
    const trimmed = text.trim()
    if (!trimmed) {
      setError('Enter a command to parse.')
      setResult(null)
      return
    }

    setIsLoading(true)
    setError(null)
    setExecutionMessage(null)

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

  function handleConfirm() {
    if (!result || result.needs_confirmation) return
    setExecutionMessage(`Mock execution queued: ${result.action}`)
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
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold text-white">1. Natural language input</h3>
          <div className="mt-4 space-y-3">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-h-32 w-full rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none ring-0 placeholder:text-white/30 focus:border-cyan-400/60"
              placeholder="Example: Schedule a meeting with Chris and Dagon next Tuesday at 11am about FineGuard."
            />

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

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold text-white">Command corpus</h3>
          <p className="mt-1 text-sm text-white/50">{commandCorpus.length} saved test commands</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {areas.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setSelectedArea(area)}
                className={`rounded-full border px-3 py-1 text-xs ${selectedArea === area ? 'border-cyan-400/70 text-white' : 'border-white/10 text-white/60 hover:border-cyan-400/60 hover:text-white'}`}
              >
                {area}
              </button>
            ))}
          </div>

          <div className="mt-4 max-h-64 space-y-2 overflow-auto pr-1">
            {filteredExamples.map((example) => (
              <button
                key={`${example.area}-${example.input}`}
                type="button"
                onClick={() => {
                  setText(example.input)
                  setResult(null)
                  setExecutionMessage(null)
                }}
                className="w-full rounded-xl border border-white/10 p-3 text-left hover:border-cyan-400/50"
              >
                <p className="text-xs text-cyan-200">{example.area} · expects {example.expected.action}</p>
                <p className="mt-1 text-sm text-white">{example.input}</p>
              </button>
            ))}
          </div>
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
          <h3 className="font-semibold text-white">2. Parsed intent JSON</h3>
          <pre className="mt-4 max-h-[520px] overflow-auto rounded-xl bg-black/40 p-4 text-xs text-cyan-100">
            {result ? JSON.stringify(result, null, 2) : 'No result yet.'}
          </pre>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold text-white">3. Execution preview</h3>
          <p className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/80">
            {preview}
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!result || result.needs_confirmation}
              className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm mock execution
            </button>
            <button
              type="button"
              onClick={() => {
                setResult(null)
                setExecutionMessage(null)
              }}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:border-white/30 hover:text-white"
            >
              Cancel
            </button>
          </div>

          {executionMessage ? (
            <p className="mt-3 text-sm text-cyan-200">{executionMessage}</p>
          ) : null}
        </div>
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
                  setExecutionMessage(null)
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
  )
}
