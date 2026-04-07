export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { monitoredCompanies } from '@/server/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  const companies = await db
    .select()
    .from(monitoredCompanies)
    .orderBy(desc(monitoredCompanies.activatedAt))
    .limit(5);

  return NextResponse.json(companies);
}
