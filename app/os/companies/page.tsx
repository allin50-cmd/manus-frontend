'use client'

import Link from 'next/link'
import { COMPANY_REGISTRY } from '@/lib/company-registry'

type CompanyVisual = {
  gradFrom: string
  gradTo: string
  glow: string
  kpi: string
  kpiLabel: string
  badge: string | null
  badgeColor: string | null
  icon: React.ReactNode
}

const COMPANY_VISUALS: Record<string, CompanyVisual> = {
  fineguard: {
    gradFrom: '#6EE7B7',
    gradTo: '#059669',
    glow: 'rgba(0,168,107,0.45)',
    kpi: '152 monitored',
    kpiLabel: 'companies',
    badge: '3 alerts',
    badgeColor: '#FF3B30',
    icon: (
      <svg className="relative z-20 w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  'builder-big-jobs': {
    gradFrom: '#FDB97A',
    gradTo: '#C2410C',
    glow: 'rgba(249,115,22,0.45)',
    kpi: '18 new leads',
    kpiLabel: 'this week',
    badge: '5 urgent',
    badgeColor: '#FF9F0A',
    icon: (
      <svg className="relative z-20 w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V9l7-6 7 6v12M9 21v-6h6v6" />
      </svg>
    ),
  },
  ultratech: {
    gradFrom: '#93BBFC',
    gradTo: '#1D4ED8',
    glow: 'rgba(59,130,246,0.45)',
    kpi: '£84,200',
    kpiLabel: 'revenue YTD',
    badge: null,
    badgeColor: null,
    icon: (
      <svg className="relative z-20 w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  accuracy: {
    gradFrom: '#C4B5FD',
    gradTo: '#6D28D9',
    glow: 'rgba(139,92,246,0.45)',
    kpi: '7 live projects',
    kpiLabel: 'in planning',
    badge: null,
    badgeColor: null,
    icon: (
      <svg className="relative z-20 w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 21V8l9-5 9 5v13M9 21v-5h6v5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3" />
      </svg>
    ),
  },
}

export default function CompaniesPage() {
  const COMPANIES = COMPANY_REGISTRY.map((co) => ({
    ...co,
    href: `/os/workspace/${co.id}`,
    ...(COMPANY_VISUALS[co.id] ?? {
      gradFrom: co.color,
      gradTo: co.color,
      glow: `${co.color}44`,
      kpi: '',
      kpiLabel: '',
      badge: null,
      badgeColor: null,
      icon: <span className="text-2xl">{co.name.charAt(0)}</span>,
    }),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Companies</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Your operating entities</p>
        </div>
        <button
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(122,90,248,0.15)', border: '1px solid rgba(122,90,248,0.25)', color: '#7A5AF8' }}
        >
          + Add Company
        </button>
      </div>

      {/* 2x2 grid */}
      <div className="grid grid-cols-2 gap-4">
        {COMPANIES.map((co) => (
          <Link
            key={co.href}
            href={co.href}
            className="group relative rounded-2xl overflow-hidden transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)', minHeight: '180px', display: 'block' }}
          >
            {/* Hover glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 30% 0%, ${co.glow} 0%, transparent 65%)` }}
            />

            <div className="relative z-10 p-5 flex flex-col" style={{ minHeight: '180px' }}>
              {/* Top row: icon + badge */}
              <div className="flex items-start justify-between mb-4">
                {/* 3D icon */}
                <div
                  className="relative w-[52px] h-[52px] rounded-[16px] overflow-hidden flex items-center justify-center"
                  style={{
                    background: `radial-gradient(circle at 30% 20%, ${co.gradFrom} 0%, ${co.color} 50%, ${co.gradTo} 100%)`,
                    boxShadow: `0 12px 32px -6px ${co.glow}, inset 0 1.5px 0 rgba(255,255,255,0.45)`,
                  }}
                >
                  <div
                    className="absolute inset-x-0 top-0 pointer-events-none"
                    style={{ height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)', borderRadius: '16px 16px 0 0' }}
                  />
                  {co.icon}
                </div>

                {/* Alert badge */}
                {co.badge && co.badgeColor && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${co.badgeColor}20`, color: co.badgeColor, border: `1px solid ${co.badgeColor}30` }}
                  >
                    {co.badge}
                  </span>
                )}
              </div>

              {/* Company name */}
              <div className="font-bold text-[15px] mb-0.5" style={{ color: 'rgba(255,255,255,0.92)' }}>{co.name}</div>
              <div className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.38)' }}>{co.tagline}</div>

              {/* KPI */}
              <div className="mt-auto">
                <div className="font-bold text-[18px]" style={{ color: co.color }}>{co.kpi}</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.32)' }}>{co.kpiLabel}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
