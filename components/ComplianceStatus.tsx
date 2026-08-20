import Link from 'next/link'
import { getApp } from '@/lib/app-registry'

interface ComplianceStatusProps {
  companyId: string
}

export default function ComplianceStatus({ companyId }: ComplianceStatusProps) {
  if (companyId !== 'fineguard') return null

  const fineguard = getApp('fineguard')
  if (!fineguard?.externalRoute) return null

  return (
    <section>
      <p
        className="text-[10px] font-semibold uppercase tracking-widest mb-3"
        style={{ color: 'rgba(255,255,255,0.22)' }}
      >
        Compliance
      </p>
      <Link
        href={fineguard.externalRoute}
        className="block p-4 rounded-2xl transition-transform hover:-translate-y-0.5"
        style={{
          background: 'rgba(0,168,107,0.1)',
          border: '1px solid rgba(0,168,107,0.2)',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: '#00A86B' }}>
              Open FineGuard
            </p>
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              View Companies House deadlines, filing risks, and compliance alerts at thefineguard.com.
            </p>
          </div>
          <span className="text-lg" aria-hidden="true">↗</span>
        </div>
      </Link>
    </section>
  )
}
