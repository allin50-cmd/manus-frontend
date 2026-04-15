import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { monitoredCompanies, complianceAlerts, webhookSubscriptions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { cacheDelete } from '@/lib/utils/cache';
import { requireApiKey } from '@/lib/utils/require-api-key';

const COMPANY_NUMBER_RE = /^([A-Z]{2}\d{6}|\d{8})$/i;

/** Deliver a Zapier REST hook with exponential backoff retry (max 2 retries). */
async function deliverHook(url: string, body: unknown, retries = 2): Promise<void> {
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok && retries > 0) {
      await delay(500 * (3 - retries)); // 500ms, then 1000ms
      return deliverHook(url, body, retries - 1);
    }
  } catch {
    if (retries > 0) {
      await delay(500 * (3 - retries));
      return deliverHook(url, body, retries - 1);
    }
  }
}

export async function POST(req: NextRequest) {
  const authError = requireApiKey(req);
  if (authError) return authError;

  const { companyNumber, companyName, alertTypes } = await req.json();

  if (!companyNumber || !companyName) {
    return NextResponse.json(
      { error: 'companyNumber and companyName are required' },
      { status: 400 },
    );
  }

  if (!COMPANY_NUMBER_RE.test(companyNumber)) {
    return NextResponse.json(
      { error: 'Invalid company number format (expected 8 digits or 2 letters + 6 digits)' },
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

  // Invalidate the recent-companies cache so the new entry is visible immediately
  cacheDelete('zapier:companies:recent');

  // Notify subscribed Zapier hooks with retry
  const hooks = await db
    .select()
    .from(webhookSubscriptions)
    .where(eq(webhookSubscriptions.event, 'company.activated'));

  // Fire deliveries in parallel, don't block the response
  Promise.all(hooks.map((hook) => deliverHook(hook.url, company))).catch(() => null);

  return NextResponse.json(company, { status: 201 });
}
