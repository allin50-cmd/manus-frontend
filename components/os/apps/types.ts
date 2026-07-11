export interface InstalledAppSummary {
  id: string
  name: string
  description: string | null
  category: string | null
  status: string
  launchUrl: string
  manifestUrl: string
  healthUrl: string | null
  iconUrl: string | null
  latestVersion: string | null
  pwa: boolean
  installationStatus: string
  installedAt: string
}
