import { NextRequest, NextResponse } from 'next/server';
import { getObligationById } from '../../../../repositories/obligation.repository';
import { requireApiKey } from '../../../../lib/utils/require-api-key';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const authError = requireApiKey(req);
  if (authError) return authError;

  const { id } = await params;

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
