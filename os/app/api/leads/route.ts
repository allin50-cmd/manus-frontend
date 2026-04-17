import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const url = new URL(req.url);
  const vertical = url.searchParams.get('vertical');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200);

  const where: Record<string, unknown> = { tenantId: session.tenantId };
  if (vertical) where.vertical = vertical;

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      vertical: true,
      name: true,
      email: true,
      stage: true,
      score: true,
      riskLevel: true,
      estimatedLeakLow: true,
      estimatedLeakHigh: true,
      complianceRiskScore: true,
      createdAt: true,
    },
  });

  const countByVertical = await prisma.lead.groupBy({
    by: ['vertical'],
    where: { tenantId: session.tenantId },
    _count: { _all: true },
  });

  return NextResponse.json({
    leads,
    counts: Object.fromEntries(countByVertical.map((c) => [c.vertical, c._count._all])),
  });
}
