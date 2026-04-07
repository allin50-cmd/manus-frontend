export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { complianceAlerts } from '@/server/db/schema';
import { desc } from 'drizzle-orm';
import { cacheGet, cacheSet } from '@/lib/utils/cache';

const CACHE_KEY = 'zapier:alerts:recent';
const CACHE_TTL_MS = 30_000; // 30 seconds

export async function GET() {
  const cached = cacheGet<object[]>(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
  }

  const alerts = await db
    .select()
    .from(complianceAlerts)
    .orderBy(desc(complianceAlerts.activatedAt))
    .limit(5);

  cacheSet(CACHE_KEY, alerts, CACHE_TTL_MS);
  return NextResponse.json(alerts, { headers: { 'X-Cache': 'MISS' } });
}
