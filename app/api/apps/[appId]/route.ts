import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ appId: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { appId } = await params

  try {
    const installation = await db.workspaceAppInstallation.findFirst({
      where: { appId, status: 'active' },
      include: { app: true, tenant: true },
    })

    if (!installation) {
      return NextResponse.json({ error: 'App not found or not installed' }, { status: 404 })
    }

    // Best-effort manifest fetch for capabilities — never fails the request.
    let capabilities: string[] = []
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      const manifestRes = await fetch(installation.app.manifestUrl, { signal: controller.signal })
      clearTimeout(timeout)
      if (manifestRes.ok) {
        const manifest = await manifestRes.json()
        if (Array.isArray(manifest.capabilities)) capabilities = manifest.capabilities
      }
    } catch {
      // Manifest unreachable — capabilities stay empty, UI shows an honest fallback.
    }

    return NextResponse.json({
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
      grantedPermissions: Array.isArray(installation.grantedPermissions) ? installation.grantedPermissions : [],
      installedAt: installation.installedAt,
      installedBy: installation.installedBy,
      tenantName: installation.tenant.name,
      installationStatus: installation.status,
    })
  } catch (err) {
    console.error('Failed to load app detail:', err)
    return NextResponse.json({ error: 'Registry temporarily unavailable' }, { status: 503 })
  }
}
