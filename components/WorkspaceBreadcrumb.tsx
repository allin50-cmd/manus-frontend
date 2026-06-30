'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { getCompany } from '@/lib/company-registry'

interface BreadcrumbSegment {
  label: string
  href: string
}

export default function WorkspaceBreadcrumb() {
  const pathname = usePathname()
  const params = useParams()
  const companyId = params?.companyId as string | undefined

  const company = companyId ? getCompany(companyId) : null
  if (!company) return null

  const segments: BreadcrumbSegment[] = [{ label: 'OS', href: '/os/today' }]

  // Add company name
  segments.push({
    label: company.name,
    href: `/os/workspace/${companyId}`,
  })

  // Determine page name from pathname
  const pageSegments = pathname.split('/').slice(4) // Skip /os/workspace/[companyId]

  if (pageSegments[0] === 'apps' && pageSegments[1]) {
    const appId = pageSegments[1]
    const appNames: Record<string, string> = {
      'smart-receptionist': 'SmartReceptionist',
      'business-anywhere': 'BusinessAnywhereOS',
      'fineguard': 'FineGuard',
      'autolawclerk': 'AutoLawClerk',
      'media-manager': 'MediaManager',
    }
    segments.push({
      label: appNames[appId] || appId,
      href: `/os/workspace/${companyId}/apps/${appId}`,
    })
  } else if (pageSegments[0]) {
    const pageNames: Record<string, string> = {
      'activity': 'Activity',
      'people': 'People',
      'documents': 'Documents',
      'notifications': 'Notifications',
      'settings': 'Settings',
    }
    segments.push({
      label: pageNames[pageSegments[0]] || pageSegments[0],
      href: `/os/workspace/${companyId}/${pageSegments[0]}`,
    })
  }

  return (
    <nav className="flex items-center gap-2 mb-6 text-xs" aria-label="Breadcrumb">
      {segments.map((segment, index) => (
        <div key={segment.href} className="flex items-center gap-2">
          <Link
            href={segment.href}
            className="transition-colors"
            style={{
              color: index === segments.length - 1 ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.48)',
            }}
          >
            {segment.label}
          </Link>
          {index < segments.length - 1 && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2.5} strokeLinecap="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          )}
        </div>
      ))}
    </nav>
  )
}
