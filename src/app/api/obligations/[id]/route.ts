import { NextRequest, NextResponse } from 'next/server';
import { getObligationById } from '../../../../repositories/obligation.repository';
import { requireApiKey } from '../../../../lib/utils/require-api-key';

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
    return NextResponse.json({ error: 'Missing obligation id' }, { status: 400 });
  }

  const obligation = await getObligationById(id);
  if (!obligation) {
    return NextResponse.json(
      { error: `Obligation not found: ${id}` },
      { status: 404 },
    );
  }

  return NextResponse.json({ obligation });
}
