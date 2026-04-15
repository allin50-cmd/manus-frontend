import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { webhookSubscriptions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireApiKey } from '@/lib/utils/require-api-key';

export async function GET(req: NextRequest) {
  const authError = requireApiKey(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const event = searchParams.get('event');

  const hooks = event
    ? await db.select().from(webhookSubscriptions).where(eq(webhookSubscriptions.event, event))
    : await db.select().from(webhookSubscriptions);

  return NextResponse.json(hooks);
}

export async function POST(req: NextRequest) {
  const authError = requireApiKey(req);
  if (authError) return authError;

  const { url, event } = await req.json();

  if (!url || !event) {
    return NextResponse.json({ error: 'url and event are required' }, { status: 400 });
  }

  const [hook] = await db
    .insert(webhookSubscriptions)
    .values({ url, event })
    .returning();

  return NextResponse.json(hook, { status: 201 });
}
