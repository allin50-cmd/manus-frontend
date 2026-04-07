import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { zapierHooks } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { url, event } = await req.json();

  if (!url || !event) {
    return NextResponse.json({ error: 'url and event are required' }, { status: 400 });
  }

  const [hook] = await db
    .insert(zapierHooks)
    .values({ url, event })
    .returning();

  return NextResponse.json(hook, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  await db.delete(zapierHooks).where(eq(zapierHooks.id, id));
  return NextResponse.json({ success: true });
}
