// One-time seed: register FineGuard as the first real installed app.
// Idempotent (upserts) — safe to re-run.
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
      launchUrl: process.env.FINEGUARD_LAUNCH_URL ?? 'http://localhost:3009',
      manifestUrl: (process.env.FINEGUARD_LAUNCH_URL ?? 'http://localhost:3009') + '/.well-known/ultracore-app.json',
      healthUrl: (process.env.FINEGUARD_LAUNCH_URL ?? 'http://localhost:3009') + '/api/health',
    },
    create: {
      id: 'fineguard',
      name: 'FineGuard',
      description: 'Companies House compliance monitoring and deadline alerts.',
      category: 'compliance',
      launchUrl: process.env.FINEGUARD_LAUNCH_URL ?? 'http://localhost:3009',
      manifestUrl: (process.env.FINEGUARD_LAUNCH_URL ?? 'http://localhost:3009') + '/.well-known/ultracore-app.json',
      healthUrl: (process.env.FINEGUARD_LAUNCH_URL ?? 'http://localhost:3009') + '/api/health',
      status: 'live',
      installable: true,
      pwa: true,
      latestVersion: '1.0.0',
    },
  })

  await prisma.appPermission.createMany({
    data: [
      { appId: app.id, permission: 'companies.read', description: 'Read monitored companies' },
      { appId: app.id, permission: 'companies.write', description: 'Add/remove monitored companies' },
      { appId: app.id, permission: 'tasks.write', description: 'Create UltraCore tasks from alerts' },
      { appId: app.id, permission: 'alerts.write', description: 'Create UltraCore alerts' },
    ],
    skipDuplicates: true,
  })

  await prisma.workspaceAppInstallation.upsert({
    where: { tenantId_appId: { tenantId: tenant.id, appId: app.id } },
    update: { status: 'active' },
    create: {
      tenantId: tenant.id,
      appId: app.id,
      status: 'active',
      installedBy: 'system-seed',
      grantedPermissions: ['companies.read', 'companies.write', 'tasks.write', 'alerts.write'],
    },
  })

  console.log('Seeded tenant:', tenant.slug, tenant.id)
  console.log('Seeded app:', app.id, app.status)
  console.log('FineGuard installed for Ultratech workspace.')
}

main().finally(() => prisma.$disconnect())
