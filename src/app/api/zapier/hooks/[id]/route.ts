import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { zapierHooks } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await db.delete(zapierHooks).where(eq(zapierHooks.id, params.id));
  return NextResponse.json({ success: true });
}
