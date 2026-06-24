import { requireAuth } from '@/lib/auth'
import OsShell from '@/components/OsShell'

export default async function TodayLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth()
  return <OsShell person={session.person}>{children}</OsShell>
}
