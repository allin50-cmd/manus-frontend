import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCompany } from '@/lib/company-registry'
import WorkspaceTabBar from './WorkspaceTabBar'
import WorkspaceBreadcrumb from '@/components/WorkspaceBreadcrumb'

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { companyId: string }
}) {
  const company = getCompany(params.companyId)
  if (!company) notFound()

  const base = `/os/workspace/${params.companyId}`

  return (
    <div>
      {/* Breadcrumb navigation */}
      <WorkspaceBreadcrumb />

      {/* Back link */}
      <Link
        href="/os/companies"
        className="inline-flex items-center gap-1.5 text-[11px] font-medium mb-4 transition-colors"
        style={{ color: 'rgba(255,255,255,0.32)' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Companies
      </Link>

      {/* Company header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl shrink-0"
            style={{
              background: `radial-gradient(circle at 35% 25%, ${company.color}cc, ${company.color}88)`,
              boxShadow: `0 4px 14px ${company.color}40`,
            }}
          />
          <div>
            <h1 className="text-lg font-bold leading-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {company.name}
            </h1>
            <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {company.tagline}
            </p>
          </div>
        </div>
        <span
          className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0"
          style={{
            background: `${company.color}18`,
            color: company.color,
            border: `1px solid ${company.color}28`,
          }}
        >
          {company.plan}
        </span>
      </div>

      {/* Tab bar — client component for active state */}
      <WorkspaceTabBar base={base} />

      {/* Page content */}
      {children}
    </div>
  )
}
