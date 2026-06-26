export type CompanyRecord = {
  id: string            // used as URL slug
  name: string
  tagline: string
  plan: string
  color: string
  enabledApps: string[] // app IDs from APP_REGISTRY
}

export const COMPANY_REGISTRY: CompanyRecord[] = [
  {
    id: 'fineguard',
    name: 'FineGuard',
    tagline: 'Compliance · Monitoring · Alerts',
    plan: 'Platform',
    color: '#00A86B',
    enabledApps: ['fineguard', 'smart-receptionist', 'business-anywhere'],
  },
  {
    id: 'builder-big-jobs',
    name: 'Builder Big Jobs',
    tagline: 'Construction Leads · Qualified Prospects',
    plan: 'Platform',
    color: '#F97316',
    enabledApps: ['smart-receptionist', 'business-anywhere'],
  },
  {
    id: 'ultratech',
    name: 'Ultratech',
    tagline: 'Operations · Projects · Communications',
    plan: 'Platform',
    color: '#3B82F6',
    enabledApps: ['fineguard', 'autolawclerk', 'smart-receptionist', 'media-manager', 'business-anywhere'],
  },
  {
    id: 'accuracy',
    name: 'Accuracy Ltd',
    tagline: 'Planning Leads · Projects · Site Visits',
    plan: 'Platform',
    color: '#8B5CF6',
    enabledApps: ['smart-receptionist', 'business-anywhere'],
  },
]

export function getCompany(id: string): CompanyRecord | undefined {
  return COMPANY_REGISTRY.find((c) => c.id === id)
}
