import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/events';
import type { TenantContext } from '@/lib/auth';
import { safeString, safeWebhookUrl } from '@/lib/validators';
import { isValidCompanyNumber, normaliseCompanyNumber } from './companiesHouse';

export const registerWebhookSchema = z.object({
  companyNumber: safeString({ min: 1, max: 20 }),
  webhookUrl: safeWebhookUrl,
});

export type RegisterWebhookInput = z.infer<typeof registerWebhookSchema>;

export interface RegisterWebhookResult {
  subscriptionId: string;
  companyNumber: string;
  webhookUrl: string;
}

export async function registerWebhook(
  ctx: TenantContext,
  input: RegisterWebhookInput,
): Promise<RegisterWebhookResult> {
  if (!isValidCompanyNumber(input.companyNumber)) {
    throw new Error(`Invalid UK company number: ${input.companyNumber}`);
  }
  const companyNumber = normaliseCompanyNumber(input.companyNumber);

  const existing = await prisma.event.findFirst({
    where: {
      tenantId: ctx.tenant.id,
      type: 'compliance.webhook.registered',
      metadata: { path: ['companyNumber'], equals: companyNumber },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    const meta = existing.metadata as Record<string, unknown>;
    if (meta.webhookUrl === input.webhookUrl) {
      return {
        subscriptionId: existing.id,
        companyNumber,
        webhookUrl: input.webhookUrl,
      };
    }
  }

  const evt = await prisma.event.create({
    data: {
      tenantId: ctx.tenant.id,
      type: 'compliance.webhook.registered',
      metadata: { companyNumber, webhookUrl: input.webhookUrl },
    },
  });

  await emit(
    'compliance.webhook.registered.announce',
    { companyNumber, webhookUrl: input.webhookUrl, subscriptionId: evt.id },
    ctx.tenant.id,
  );

  return { subscriptionId: evt.id, companyNumber, webhookUrl: input.webhookUrl };
}

export async function listWebhooksForCompany(
  tenantId: string,
  companyNumber: string,
): Promise<string[]> {
  const normalised = normaliseCompanyNumber(companyNumber);
  const rows = await prisma.event.findMany({
    where: {
      tenantId,
      type: 'compliance.webhook.registered',
      metadata: { path: ['companyNumber'], equals: normalised },
    },
  });
  const urls = new Set<string>();
  for (const row of rows) {
    const meta = row.metadata as Record<string, unknown>;
    if (typeof meta.webhookUrl === 'string') urls.add(meta.webhookUrl);
  }
  return [...urls];
}
