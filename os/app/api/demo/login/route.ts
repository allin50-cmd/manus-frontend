import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { signSession } from '@/lib/session';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from '@/lib/session';

export const runtime = 'nodejs';

const DEMO_EMAIL = 'demo@fineguardpro.test';
const DEMO_SUBDOMAIN = 'demo';
const DEMO_TENANT_NAME = 'Demo Co';

async function handle(req: NextRequest) {
  if (process.env.DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let tenant = await prisma.tenant.findUnique({ where: { subdomain: DEMO_SUBDOMAIN } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: DEMO_TENANT_NAME, subdomain: DEMO_SUBDOMAIN, plan: 'pro' },
    });
  } else if (tenant.plan !== 'pro') {
    tenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: { plan: 'pro' },
    });
  }

  let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: DEMO_EMAIL,
        passwordHash: hashPassword(crypto.randomUUID()),
        role: 'owner',
      },
    });
  }

  const token = await signSession({
    userId: user.id,
    tenantId: tenant.id,
    email: user.email,
    role: user.role,
    plan: tenant.plan,
  });
  const origin = `https://${req.headers.get('host')}`;
  const res = NextResponse.redirect(`${origin}/companies`, 302);
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

export async function GET(req: NextRequest) {
  try { return await handle(req); }
  catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Demo login failed', detail: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) { return GET(req); }
