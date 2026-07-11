import AppCard from './AppCard'
import EmptyAppsState from './EmptyAppsState'
import type { InstalledAppSummary } from './types'

export default function InstalledAppsGrid({ apps }: { apps: InstalledAppSummary[] }) {
  if (apps.length === 0) {
    return <EmptyAppsState />
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  )
}
