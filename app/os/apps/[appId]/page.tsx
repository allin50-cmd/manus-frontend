import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import AppShell from '@/components/os/layout/AppShell'
import AppDetailPanel from '@/components/os/apps/AppDetailPanel'
import { getCurrentTenantId } from '@/lib/apps/tenant'

export const dynamic = 'force-dynamic'

export default async function AppDetailPage({ params }: { params: Promise<{ appId: string }> }) {
  await requireAuth()
  const { appId } = await params

  const tenantId = await getCurrentTenantId()
  if (!tenantId) notFound()

  const installation = await db.workspaceAppInstallation.findFirst({
    where: { appId, status: 'active', tenantId },
    include: { app: true, tenant: true },
  })

  if (!installation) {
    notFound()
  }

  let capabilities: string[] = []
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const manifestRes = await fetch(installation.app.manifestUrl, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timeout)
    if (manifestRes.ok) {
      const manifest = await manifestRes.json()
      if (Array.isArray(manifest.capabilities)) capabilities = manifest.capabilities
    }
  } catch {
    // Manifest unreachable — panel shows an honest "not published" fallback.
  }

  return (
    <AppShell>
      <AppDetailPanel
        app={{
          id: installation.app.id,
          name: installation.app.name,
          description: installation.app.description,
          category: installation.app.category,
          status: installation.app.status,
          launchUrl: installation.app.launchUrl,
          manifestUrl: installation.app.manifestUrl,
          healthUrl: installation.app.healthUrl,
          iconUrl: installation.app.iconUrl,
          latestVersion: installation.app.latestVersion,
          capabilities,
          grantedPermissions: Array.isArray(installation.grantedPermissions)
            ? (installation.grantedPermissions as string[])
            : [],
          installedAt: installation.installedAt.toISOString(),
          installedBy: installation.installedBy,
          tenantName: installation.tenant.name,
          installationStatus: installation.status,
        }}
      />
    </AppShell>
  )
}
