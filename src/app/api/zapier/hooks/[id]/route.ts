import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { zapierHooks } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireApiKey } from '@/lib/utils/require-api-key';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireApiKey(req);
  if (authError) return authError;
  const { id } = await params;

  await db.delete(zapierHooks).where(eq(zapierHooks.id, id));
  return NextResponse.json({ success: true });
}
