import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbOk = await checkDatabaseConnection();

  const stripeConfigured =
    !!process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_SECRET_KEY.startsWith('sk_') &&
    !process.env.STRIPE_SECRET_KEY.includes('placeholder');

  const chConfigured =
    !!process.env.COMPANIES_HOUSE_API_KEY &&
    process.env.COMPANIES_HOUSE_API_KEY !== 'placeholder';

  return NextResponse.json({
    database:       dbOk ? 'connected' : 'disconnected',
    stripe:         stripeConfigured ? 'configured' : 'not-configured',
    companiesHouse: chConfigured ? 'configured' : 'not-configured',
    temporal:       process.env.TEMPORAL_ADDRESS ?? 'not-set',
    timestamp:      new Date().toISOString(),
  }, { status: dbOk ? 200 : 503 });
}
