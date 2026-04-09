import { NextRequest, NextResponse } from 'next/server';
import { listObligationsByCompany } from '../../../../../repositories/obligation.repository';
import { requireApiKey } from '../../../../../lib/utils/require-api-key';

interface RouteContext {
  params: { id: string };
}

export async function GET(
  req: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const authError = requireApiKey(req);
  if (authError) return authError;
  const { id } = context.params;

  if (!id) {
    return NextResponse.json(
      { error: 'Missing company id' },
      { status: 400 },
    );
  }

  const obligations = await listObligationsByCompany(id);

  return NextResponse.json({ obligations });
}
