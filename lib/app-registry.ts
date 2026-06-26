export type AppStatus = 'live' | 'beta' | 'coming_soon'
export type AppCategory = 'compliance' | 'legal' | 'communications' | 'operations' | 'media'

export type AppDefinition = {
  id: string
  name: string
  icon: string
  description: string
  category: AppCategory
  status: AppStatus
  color: string
  externalRoute?: string  // existing page to link to instead of workspace sub-route
}

export const APP_REGISTRY: AppDefinition[] = [
  {
    id: 'fineguard',
    name: 'FineGuard',
    icon: '🛡️',
    description: 'Companies House compliance monitoring and deadline alerts.',
    category: 'compliance',
    status: 'live',
    color: '#00A86B',
    externalRoute: '/os/companies/fineguard',
  },
  {
    id: 'autolawclerk',
    name: 'AutoLawClerk',
    icon: '⚖️',
    description: 'Legal case management, hearings, and bundle generation.',
    category: 'legal',
    status: 'coming_soon',
    color: '#3D8BFF',
  },
  {
    id: 'smart-receptionist',
    name: 'SmartReceptionist',
    icon: '🎤',
    description: 'AI voice intake, call routing, and work capture.',
    category: 'communications',
    status: 'beta',
    color: '#7A5AF8',
    externalRoute: '/os/talk',
  },
  {
    id: 'media-manager',
    name: 'MediaManager',
    icon: '📸',
    description: 'Brand and media asset management.',
    category: 'media',
    status: 'coming_soon',
    color: '#FF8A34',
  },
  {
    id: 'business-anywhere',
    name: 'BusinessAnywhereOS',
    icon: '📱',
    description: 'Mobile-first field operations — book, quote, scan, go.',
    category: 'operations',
    status: 'beta',
    color: '#20AFFF',
    externalRoute: '/os',
  },
]

export function getApp(id: string): AppDefinition | undefined {
  return APP_REGISTRY.find((a) => a.id === id)
}

export function getApps(ids: string[]): AppDefinition[] {
  return ids.map((id) => APP_REGISTRY.find((a) => a.id === id)).filter(Boolean) as AppDefinition[]
}
