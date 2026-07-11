// One-time seed: register FineGuard as the first real installed app.
// Idempotent (upserts) — safe to re-run.
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Production URL is the source of truth. Re-running this seed must never
// silently revert a live app's launch URL back to a local dev default —
// that regression happened once already (caught during Phase 2A hardening).
const FINEGUARD_URL = process.env.FINEGUARD_LAUNCH_URL ?? 'https://fineguard-pro.vercel.app'

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'ultratech' },
    update: {},
    create: {
      name: 'Ultratech',
      slug: 'ultratech',
      plan: 'platform',
    },
  })

  const app = await prisma.app.upsert({
    where: { id: 'fineguard' },
    update: {
      launchUrl: FINEGUARD_URL,
      manifestUrl: `${FINEGUARD_URL}/.well-known/ultracore-app.json`,
      healthUrl: `${FINEGUARD_URL}/api/health`,
    },
    create: {
      id: 'fineguard',
      name: 'FineGuard',
      description: 'Companies House compliance monitoring and deadline alerts.',
      category: 'compliance',
      launchUrl: FINEGUARD_URL,
      manifestUrl: `${FINEGUARD_URL}/.well-known/ultracore-app.json`,
      healthUrl: `${FINEGUARD_URL}/api/health`,
      status: 'live',
      installable: true,
      pwa: true,
      latestVersion: '1.0.0',
    },
  })

  // Mirrors what FineGuard V1 actually implements (src/server/actions.ts) —
  // no tasks.write, since there is no UltraCore task-creation integration yet.
  await prisma.appPermission.createMany({
    data: [
      { appId: app.id, permission: 'companies.read', description: 'Read monitored companies' },
      { appId: app.id, permission: 'companies.write', description: 'Add/remove monitored companies' },
      { appId: app.id, permission: 'alerts.write', description: 'Mark compliance alerts handled' },
    ],
    skipDuplicates: true,
  })

  await prisma.workspaceAppInstallation.upsert({
    where: { tenantId_appId: { tenantId: tenant.id, appId: app.id } },
    update: { grantedPermissions: ['companies.read', 'companies.write', 'alerts.write'], status: 'active' },
    create: {
      tenantId: tenant.id,
      appId: app.id,
      status: 'active',
      installedBy: 'system-seed',
      grantedPermissions: ['companies.read', 'companies.write', 'alerts.write'],
    },
  })

  console.log('Seeded tenant:', tenant.slug, tenant.id)
  console.log('Seeded app:', app.id, app.status)
  console.log('FineGuard installed for Ultratech workspace.')
}

main().finally(() => prisma.$disconnect())
