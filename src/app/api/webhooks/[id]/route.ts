import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { webhookSubscriptions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireApiKey } from '@/lib/utils/require-api-key';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireApiKey(req);
  if (authError) return authError;

  const { id } = await params;
  await db.delete(webhookSubscriptions).where(eq(webhookSubscriptions.id, id));
  return NextResponse.json({ success: true });
}
