import type { TenantContext } from '@/lib/auth';
import { submitRevenueAudit, submitSchema } from './submit';
import { generateRevenueNarrative } from './narrative';

export async function handleRevenueAction(
  ctx: TenantContext,
  action: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  switch (action) {
    case 'submit': {
      const parsed = submitSchema.parse(payload);
      return submitRevenueAudit(ctx, parsed);
    }
    case 'narrative': {
      const { lead, result } = payload as {
        lead: { name: string; system?: string; sizeTier?: string; painPoints?: string[] };
        result: Parameters<typeof generateRevenueNarrative>[0]['result'];
      };
      const narrative = await generateRevenueNarrative({ lead, result });
      return { narrative };
    }
    default:
      throw new Error(`Unknown revenue action: ${action}`);
  }
}
