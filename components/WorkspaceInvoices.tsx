import Link from 'next/link'

interface WorkspaceInvoicesProps {
  companyId: string
  companyName: string
}

export default function WorkspaceInvoices({ companyId }: WorkspaceInvoicesProps) {
  return (
    <div
      className="p-4 rounded-2xl flex items-center justify-between gap-4"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <Link
        href={`/os/money/invoices?companyId=${encodeURIComponent(companyId)}`}
        className="text-xs font-semibold text-blue-400 hover:text-blue-300"
      >
        View invoices &rarr;
      </Link>
      <Link
        href={`/os/money/invoices/new?companyId=${encodeURIComponent(companyId)}`}
        className="text-xs font-semibold text-blue-400 hover:text-blue-300"
      >
        + New invoice
      </Link>
    </div>
  )
}
