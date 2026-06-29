<<<<<<< Updated upstream
interface OutreachLog {
  id: string
  person: string
  channel: string
  summary: string
  occurredAt: Date | string
}

interface Props {
  logs: OutreachLog[]
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function OutreachLogSection({ logs }: Props) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
        Outreach Log
      </h2>
      {logs.length === 0 ? (
        <p className="text-sm text-slate-400">No outreach yet</p>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex gap-3 text-sm py-2 border-b border-slate-100 last:border-0"
            >
              <span className="text-xs text-slate-400 whitespace-nowrap shrink-0 pt-0.5">
                {fmtDate(log.occurredAt)}
              </span>
              <div>
                <span className="text-xs font-medium text-slate-600">{log.person}</span>
                {' · '}
                <span className="text-xs text-slate-500">{log.channel}</span>
                <p className="text-sm text-slate-800">{log.summary}</p>
              </div>
=======
type OutreachLog = {
  id: string
  channel?: string | null
  direction?: string | null
  summary?: string | null
  outcome?: string | null
  createdAt?: Date | string | null
}

export default function OutreachLogSection({ logs }: { logs?: OutreachLog[] }) {
  const safeLogs = logs ?? []

  return (
    <section className="rounded-lg border bg-white p-4">
      <h2 className="text-lg font-semibold">Outreach history</h2>

      {safeLogs.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">No outreach logged yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {safeLogs.map((log) => (
            <div key={log.id} className="rounded-md border p-3">
              <div className="text-sm font-medium">
                {log.channel ?? 'Outreach'} {log.direction ? `· ${log.direction}` : ''}
              </div>
              {log.summary && <p className="mt-1 text-sm text-gray-700">{log.summary}</p>}
              {log.outcome && <p className="mt-1 text-xs text-gray-500">Outcome: {log.outcome}</p>}
>>>>>>> Stashed changes
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
