import Link from 'next/link'

interface WorkspaceQuotesProps {
  companyId: string
  companyName: string
}

export default function WorkspaceQuotes({ companyId }: WorkspaceQuotesProps) {
  return (
    <div
      className="p-4 rounded-2xl flex items-center justify-between gap-4"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <Link
        href={`/os/money/quotes?companyId=${encodeURIComponent(companyId)}`}
        className="text-xs font-semibold text-amber-400 hover:text-amber-300"
      >
        View quotes &rarr;
      </Link>
      <Link
        href={`/os/money/quotes/new?companyId=${encodeURIComponent(companyId)}`}
        className="text-xs font-semibold text-amber-400 hover:text-amber-300"
      >
        + New quote
      </Link>
    </div>
  )
}
