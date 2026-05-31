import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signSession } from '@/lib/session';
import { getSessionFromCookies, setSessionCookie } from '@/lib/session-cookies';

export const runtime = 'nodejs';

export async function POST() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { tenant: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const token = await signSession({
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    role: user.role,
    plan: user.tenant.plan,
  });
  setSessionCookie(token);
  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role },
    tenant: { id: user.tenant.id, name: user.tenant.name, plan: user.tenant.plan },
  });
}
