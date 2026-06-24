import { requireAuth } from '@/lib/auth'
import OsShell from '@/components/OsShell'
import { trackEvent } from '@/lib/ut-tracker'

export default async function OsLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth()
  await trackEvent({ eventType: 'app_opened', userId: session.person })
  return <OsShell person={session.person}>{children}</OsShell>
}
