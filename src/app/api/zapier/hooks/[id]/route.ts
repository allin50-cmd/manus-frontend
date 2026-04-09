import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { zapierHooks } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireApiKey } from '@/lib/utils/require-api-key';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const authError = requireApiKey(req);
  if (authError) return authError;

  await db.delete(zapierHooks).where(eq(zapierHooks.id, params.id));
  return NextResponse.json({ success: true });
}
