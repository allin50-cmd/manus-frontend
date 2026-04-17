import type { TenantContext } from '@/lib/auth';

export async function handleLawAction(
  _ctx: TenantContext,
  action: string,
  _payload: Record<string, unknown>,
): Promise<unknown> {
  throw new Error(`Law vertical not implemented yet (action: ${action})`);
}
