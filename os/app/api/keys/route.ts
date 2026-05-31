import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateApiKey } from '@/lib/auth';
import { getSessionFromRequest } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const keys = await prisma.apiKey.findMany({
    where: { tenantId: session.tenantId },
    select: { id: true, vertical: true, active: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ keys });
}

const createSchema = z.object({
  vertical: z.enum(['revenue', 'law', 'compliance']),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { enabledVerticals: true },
  });
  if (!tenant || !tenant.enabledVerticals.includes(parsed.data.vertical)) {
    return NextResponse.json(
      { error: `Vertical '${parsed.data.vertical}' not enabled — upgrade to Pro` },
      { status: 402 },
    );
  }
  const kp = generateApiKey();
  const key = await prisma.apiKey.create({
    data: {
      tenantId: session.tenantId,
      vertical: parsed.data.vertical,
      keyHash: kp.hash,
    },
    select: { id: true, vertical: true, createdAt: true },
  });
  return NextResponse.json({ ...key, rawKey: kp.raw });
}
