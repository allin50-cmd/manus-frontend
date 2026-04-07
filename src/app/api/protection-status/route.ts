import { NextRequest, NextResponse } from 'next/server';
import { findByCompanyNumber } from '@/server/repositories/monitoredCompanies.repo';
import { findByCompany } from '@/server/repositories/complianceAlerts.repo';

export async function GET(req: NextRequest) {
  const companyNumber = req.nextUrl.searchParams.get('companyNumber');
  if (!companyNumber) {
    return NextResponse.json({ error: 'companyNumber is required' }, { status: 400 });
  }

  const [row, alerts] = await Promise.all([
    findByCompanyNumber(companyNumber),
    findByCompany(companyNumber),
  ]);

  return NextResponse.json({
    monitored: !!row,
    activatedAt: row?.activatedAt ?? null,
    alerts: alerts.map((a) => a.alertType),
  });
}
