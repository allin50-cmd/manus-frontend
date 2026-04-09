import { NextRequest, NextResponse } from 'next/server';
import { listObligationsByCompany } from '../../../../../repositories/obligation.repository';

interface RouteContext {
  params: { id: string };
}

export async function GET(
  _req: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
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
