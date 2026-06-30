import { notFound } from 'next/navigation'
import { getCompany } from '@/lib/company-registry'

export default function WorkspaceSettingsPage({
  params,
}: {
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  return (
    <div className="space-y-4">
      {/* Company info read-only */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-4"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          Company
        </p>
        <div className="space-y-3">
          <Row label="Name" value={company.name} />
          <Row label="Slug" value={company.id} />
          <Row label="Plan" value={company.plan} />
          <Row label="Tagline" value={company.tagline} />
        </div>
      </div>

      <div
        className="rounded-2xl p-8 flex flex-col items-center text-center"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)' }}
      >
        <span className="text-3xl mb-3" aria-hidden>⚙️</span>
        <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Full settings coming soon
        </p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Manage users, billing, and application permissions.
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{value}</span>
    </div>
  )
}
