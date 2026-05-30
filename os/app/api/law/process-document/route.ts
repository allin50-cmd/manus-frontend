import type { NextRequest } from 'next/server';
import { resolveTenantFromRequest, assertVerticalEnabled } from '@/lib/auth';
import { fail, ok, unauthorized } from '@/lib/http';
import { processDocument, processDocumentSchema } from '@/lib/verticals/law/actions';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const ctx = await resolveTenantFromRequest(req);
  if (!ctx) return unauthorized();

  try {
    assertVerticalEnabled(ctx, 'law');
  } catch (res) {
    if (res instanceof Response) return res;
    throw res;
  }

  const body = await req.json().catch(() => null);
  const parsed = processDocumentSchema.safeParse(body);
  if (!parsed.success) return fail('Invalid request', 400, { issues: parsed.error.issues });

  try {
    const result = await processDocument(ctx, parsed.data);
    return ok(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Document processing failed';
    return fail(message, 422);
  }
}
