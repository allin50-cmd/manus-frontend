import type { TenantContext } from '@/lib/auth';

export async function handleComplianceAction(
  _ctx: TenantContext,
  action: string,
  _payload: Record<string, unknown>,
): Promise<unknown> {
  throw new Error(`Compliance vertical not implemented yet (action: ${action})`);
}
