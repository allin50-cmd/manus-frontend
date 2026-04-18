import { createHash, randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { getSessionFromRequest } from './session';

export interface TenantContext {
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    enabledVerticals: string[];
    defaultVertical: string;
  };
  apiKey: {
    id: string;
    vertical: string;
  };
}

export function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function generateApiKey(): { raw: string; hash: string } {
  const raw = `uios_${randomBytes(24).toString('hex')}`;
  return { raw, hash: hashKey(raw) };
}

export async function resolveTenantFromRequest(
  req: NextRequest,
): Promise<TenantContext | null> {
  const raw = req.headers.get('x-api-key');
  if (raw) {
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash: hashKey(raw) },
      include: { tenant: true },
    });
    if (!apiKey || !apiKey.active) return null;
    return {
      tenant: {
        id: apiKey.tenant.id,
        name: apiKey.tenant.name,
        subdomain: apiKey.tenant.subdomain,
        enabledVerticals: apiKey.tenant.enabledVerticals,
        defaultVertical: apiKey.tenant.defaultVertical,
      },
      apiKey: { id: apiKey.id, vertical: apiKey.vertical },
    };
  }

  const session = await getSessionFromRequest(req);
  if (!session) return null;

  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });
  if (!tenant) return null;

  return {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      enabledVerticals: tenant.enabledVerticals,
      defaultVertical: tenant.defaultVertical,
    },
    apiKey: { id: 'session', vertical: tenant.defaultVertical },
  };
}

export function assertVerticalEnabled(ctx: TenantContext, vertical: string): void {
  if (!ctx.tenant.enabledVerticals.includes(vertical)) {
    throw new Response(
      JSON.stringify({ error: `Vertical '${vertical}' not enabled for tenant` }),
      { status: 403, headers: { 'content-type': 'application/json' } },
    );
  }
}
