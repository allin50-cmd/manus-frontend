import { NextRequest, NextResponse } from 'next/server';
import { getObligationById } from '../../../../repositories/obligation.repository';

interface RouteContext {
  params: { id: string };
}

export async function GET(
  _req: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
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
