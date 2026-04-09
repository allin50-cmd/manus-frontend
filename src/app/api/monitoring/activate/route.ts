import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  findCompanyByNumber,
  findCompanyById,
  insertMonitoredCompany,
} from '../../../../repositories/company.repository';
import { insertObligation } from '../../../../repositories/obligation.repository';
import { startObligationWorkflow } from '../../../../domain/services/workflow-start.service';
import { requireApiKey } from '../../../../lib/utils/require-api-key';
import type { ObligationType } from '../../../../domain/types/obligation';

const activateSchema = z.object({
  tenantId: z.string().uuid('tenantId must be a UUID'),
  companyNumber: z.string().min(1).max(50),
  companyName: z.string().min(1).max(255),
});

const OBLIGATION_TYPES: ObligationType[] = [
  'accounts_filing',
  'confirmation_statement',
];

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authError = requireApiKey(req);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = activateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { tenantId, companyNumber, companyName } = parsed.data;

  // Find or create the monitored company
  let company = await findCompanyByNumber(tenantId, companyNumber);
  if (!company) {
    const created = await insertMonitoredCompany({
      tenantId,
      companyNumber,
      companyName,
    });
    company = await findCompanyById(created.id);
  }

  if (!company) {
    return NextResponse.json(
      { error: 'Failed to create monitored company' },
      { status: 500 },
    );
  }

  // Create obligations in parallel, then start workflows in parallel
  const inserted = await Promise.all(
    OBLIGATION_TYPES.map((obligationType) =>
      insertObligation({ tenantId, monitoredCompanyId: company.id, obligationType, status: 'pending' })
        .then(({ id }) => ({ id, type: obligationType })),
    ),
  );

  const obligations = await Promise.all(
    inserted.map(({ id: obligationId, type: obligationType }) =>
      startObligationWorkflow({ tenantId, obligationId, monitoredCompanyId: company.id, obligationType })
        .then(({ workflowId }) => ({ id: obligationId, type: obligationType, workflowId })),
    ),
  );

  return NextResponse.json(
    {
      monitoredCompanyId: company.id,
      obligations,
    },
    { status: 201 },
  );
}
