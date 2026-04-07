export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { complianceAlerts } from '@/server/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  const alerts = await db
    .select()
    .from(complianceAlerts)
    .orderBy(desc(complianceAlerts.activatedAt))
    .limit(5);

  return NextResponse.json(alerts);
}
