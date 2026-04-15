import { NextRequest, NextResponse } from 'next/server';
import { findByCompanyNumber } from '@/server/repositories/monitoredCompanies.repo';
import { findByCompany } from '@/server/repositories/complianceAlerts.repo';
import { cacheGet, cacheSet } from '@/lib/utils/cache';
import { requireSession } from '@/lib/auth/session';

const COMPANY_NUMBER_RE = /^([A-Z]{2}\d{6}|\d{8})$/i;
const CACHE_TTL_MS = 60_000; // 60 seconds

export async function GET(req: NextRequest) {
  const unauth = await requireSession(req);
  if (unauth) return unauth;

  const companyNumber = req.nextUrl.searchParams.get('companyNumber');
  if (!companyNumber) {
    return NextResponse.json({ error: 'companyNumber is required' }, { status: 400 });
  }
  if (!COMPANY_NUMBER_RE.test(companyNumber)) {
    return NextResponse.json({ error: 'Invalid company number format' }, { status: 400 });
  }

  const cacheKey = `protection:${companyNumber.toUpperCase()}`;
  const cached = cacheGet<object>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
  }

  const [row, alerts] = await Promise.all([
    findByCompanyNumber(companyNumber),
    findByCompany(companyNumber),
  ]);

  const payload = {
    monitored: !!row,
    activatedAt: row?.activatedAt ?? null,
    alerts: alerts.map((a) => a.alertType),
  };

  cacheSet(cacheKey, payload, CACHE_TTL_MS);
  return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } });
}
