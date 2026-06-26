import { notFound } from 'next/navigation'
import { getCompany } from '@/lib/company-registry'

export default function WorkspaceActivityPage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  return (
    <div
      className="rounded-2xl p-8 flex flex-col items-center text-center"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}
    >
      <span className="text-3xl mb-3" aria-hidden>📋</span>
      <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
        Activity feed coming soon
      </p>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
        All events across {company.name} applications will appear here.
      </p>
    </div>
  )
}
