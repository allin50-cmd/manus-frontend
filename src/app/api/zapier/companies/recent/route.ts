export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { monitoredCompanies } from '@/server/db/schema';
import { desc } from 'drizzle-orm';
import { cacheGet, cacheSet } from '@/lib/utils/cache';

const CACHE_KEY = 'zapier:companies:recent';
const CACHE_TTL_MS = 30_000; // 30 seconds

export async function GET() {
  const cached = cacheGet<object[]>(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
  }

  const companies = await db
    .select()
    .from(monitoredCompanies)
    .orderBy(desc(monitoredCompanies.activatedAt))
    .limit(5);

  cacheSet(CACHE_KEY, companies, CACHE_TTL_MS);
  return NextResponse.json(companies, { headers: { 'X-Cache': 'MISS' } });
}
