import { db } from '@/lib/db'

// Single choke point for resolving "the current workspace." The session model
// has no per-user tenant mapping yet (predates the app-platform work) — every
// known person implicitly shares the one 'ultratech' workspace. Routing all
// tenant-scoped queries through this function means the moment real per-user
// tenant resolution exists, it changes in one place instead of six.
export async function getCurrentTenantId(): Promise<string | null> {
  const tenant = await db.tenant.findUnique({ where: { slug: 'ultratech' } })
  return tenant?.id ?? null
}
