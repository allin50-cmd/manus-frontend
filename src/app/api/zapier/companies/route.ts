import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { monitoredCompanies, complianceAlerts, zapierHooks } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { companyNumber, companyName, alertTypes } = await req.json();

  if (!companyNumber || !companyName) {
    return NextResponse.json(
      { error: 'companyNumber and companyName are required' },
      { status: 400 },
    );
  }

  const [company] = await db
    .insert(monitoredCompanies)
    .values({
      companyNumber,
      companyName,
      stripeSessionId: 'zapier-direct',
    })
    .onConflictDoUpdate({
      target: monitoredCompanies.companyNumber,
      set: { companyName },
    })
    .returning();

  const types: string[] = alertTypes
    ? alertTypes.split(',').map((t: string) => t.trim())
    : ['accounts_filing', 'confirmation_statement', 'strike_off'];

  await Promise.all(
    types.map((alertType) =>
      db
        .insert(complianceAlerts)
        .values({ companyNumber, alertType })
        .onConflictDoNothing(),
    ),
  );

  // Notify subscribed Zapier hooks for company.activated
  const hooks = await db
    .select()
    .from(zapierHooks)
    .where(eq(zapierHooks.event, 'company.activated'));

  await Promise.all(
    hooks.map((hook) =>
      fetch(hook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      }).catch(() => null),
    ),
  );

  return NextResponse.json(company, { status: 201 });
}
