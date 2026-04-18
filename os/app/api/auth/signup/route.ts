import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { generateApiKey } from '@/lib/auth';
import { signSession } from '@/lib/session';
import { setSessionCookie } from '@/lib/session-cookies';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  tenantName: z.string().min(1).max(120),
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50) || 'tenant';
}

export async function POST(req: NextRequest) {
  try {
    return await _post(req);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[signup]', msg);
    return NextResponse.json({ error: 'Internal error', detail: msg }, { status: 500 });
  }
}

async function _post(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }
  const { email, password, tenantName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const base = slugify(tenantName);
  let subdomain = base;
  for (let i = 1; i < 50; i++) {
    const taken = await prisma.tenant.findUnique({ where: { subdomain } });
    if (!taken) break;
    subdomain = `${base}-${i}`;
  }

  const tenant = await prisma.tenant.create({
    data: { name: tenantName, subdomain },
  });

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email,
      passwordHash: hashPassword(password),
      role: 'owner',
    },
  });

  const keyPair = generateApiKey();
  await prisma.apiKey.create({
    data: {
      tenantId: tenant.id,
      vertical: tenant.defaultVertical,
      keyHash: keyPair.hash,
    },
  });

  const token = await signSession({
    userId: user.id,
    tenantId: tenant.id,
    email: user.email,
    role: user.role,
    plan: tenant.plan,
  });
  setSessionCookie(token);

  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role },
    tenant: { id: tenant.id, name: tenant.name, plan: tenant.plan },
    apiKey: keyPair.raw,
  });
}
