import type { TenantContext } from '@/lib/auth';
import { checkCompany, checkCompanySchema } from './check';
import { registerWebhook, registerWebhookSchema } from './webhook';

export async function handleComplianceAction(
  ctx: TenantContext,
  action: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  switch (action) {
    case 'check-company':
      return checkCompany(ctx, checkCompanySchema.parse(payload));
    case 'register-webhook':
      return registerWebhook(ctx, registerWebhookSchema.parse(payload));
    default:
      throw new Error(`Unknown compliance action: ${action}`);
  }
}

export { checkCompanySchema, registerWebhookSchema };
