import { NextRequest, NextResponse } from 'next/server';
import { listObligationsByCompany } from '../../../../../repositories/obligation.repository';
import { requireApiKey } from '../../../../../lib/utils/require-api-key';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const authError = requireApiKey(req);
  if (authError) return authError;
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: 'Missing company id' },
      { status: 400 },
    );
  }

  const obligations = await listObligationsByCompany(id);

  return NextResponse.json({ obligations });
}
