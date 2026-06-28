'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { COMPANY_REGISTRY } from '@/lib/company-registry'

export default function CompanyPicker() {
  const params = useParams()
  const companyId = params?.companyId as string | undefined
  const [open, setOpen] = useState(false)

  const currentCompany = COMPANY_REGISTRY.find((c) => c.id === companyId)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
        style={{
          background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
          border: open ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {currentCompany && (
          <div
            className="w-6 h-6 rounded-lg shrink-0"
            style={{
              background: `radial-gradient(circle at 35% 25%, ${currentCompany.color}cc, ${currentCompany.color}88)`,
            }}
          />
        )}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {currentCompany?.name ?? 'Select company'}
          </p>
          <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {currentCompany?.tagline ?? 'Choose workspace'}
          </p>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={2.5}
          strokeLinecap="round"
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-xl z-50 overflow-hidden shadow-2xl"
          style={{ background: 'rgba(10, 18, 40, 0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="max-h-64 overflow-y-auto">
            {COMPANY_REGISTRY.map((company) => (
              <Link
                key={company.id}
                href={`/os/workspace/${company.id}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/5 border-b border-white/5 last:border-b-0"
              >
                <div
                  className="w-8 h-8 rounded-lg shrink-0"
                  style={{
                    background: `radial-gradient(circle at 35% 25%, ${company.color}cc, ${company.color}88)`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    {company.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {company.tagline}
                  </p>
                </div>
                {company.id === companyId && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={company.color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
