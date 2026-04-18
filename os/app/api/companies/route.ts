import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/session';
import { getPlan, canAddCompany } from '@/lib/plans';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const companies = await prisma.company.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ companies });
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  companyNumber: z.string().max(20).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const count = await prisma.company.count({ where: { tenantId: session.tenantId } });

  if (!canAddCompany(session.plan, count)) {
    const plan = getPlan(session.plan);
    return NextResponse.json(
      { error: `Company limit reached. Your ${plan.label} plan allows ${plan.companies} companies. Upgrade to add more.` },
      { status: 403 },
    );
  }

  const company = await prisma.company.create({
    data: {
      tenantId: session.tenantId,
      name: parsed.data.name,
      companyNumber: parsed.data.companyNumber,
    },
  });

  return NextResponse.json({ company }, { status: 201 });
}
