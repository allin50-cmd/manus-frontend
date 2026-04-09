import { Context } from '@temporalio/activity';
import { log } from '../../lib/logger';
import {
  getObligationById,
  updateObligationNextActionAt,
  updateObligationStatus,
} from '../../repositories/obligation.repository';
import { findCompanyById } from '../../repositories/company.repository';
import { db } from '../../db/client';
import { complianceObligations, externalSourceSnapshots } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { daysUntil, toTemporalDuration } from '../../lib/time';
import type { ObligationSnapshot, ObligationType } from '../../domain/types/obligation';

/**
 * Fetch the current filing deadline from Companies House and persist a snapshot.
 *
 * When COMPANIES_HOUSE_API_KEY is set: calls the live CH API to get the real
 * due date (accounts or confirmation statement) and updates the obligation row
 * if the date has changed.
 *
 * Falls back to the due date already stored in the DB if the key is absent,
 * the company is not found, or the API call fails — so the workflow continues
 * safely in test/staging without a live API key.
 */
export async function refreshObligationState(input: {
  obligationId: string;
}): Promise<ObligationSnapshot> {
  const { obligationId } = input;

  const obligation = await getObligationById(obligationId);
  if (!obligation) {
    throw new Error(`Obligation not found: ${obligationId}`);
  }

  const company = await findCompanyById(obligation.monitoredCompanyId);
  if (!company) {
    throw new Error(`Company not found for obligation: ${obligationId}`);
  }

  const checkedAt = new Date();
  let dueDate: string | null = obligation.dueDate;
  let resolved = obligation.status === 'resolved';
  let rawData: Record<string, unknown> = { source: 'db_fallback', companyNumber: company.companyNumber };

  // ── Live Companies House fetch ──────────────────────────────────────────────
  if (process.env.COMPANIES_HOUSE_API_KEY) {
    try {
      const { companiesHouseService } = await import('../../server/services/companiesHouse');
      const profile = await companiesHouseService.getCompanyProfile(company.companyNumber);

      if (profile) {
        const liveDueDate = extractDueDate(profile, obligation.obligationType);
        if (liveDueDate) dueDate = liveDueDate;

        const dissolvedStatuses = ['dissolved', 'converted-closed', 'removed'];
        if (dissolvedStatuses.includes((profile.companyStatus ?? '').toLowerCase())) {
          resolved = true;
        }

        rawData = {
          source: 'companies_house',
          companyStatus: profile.companyStatus,
          accounts: profile.accounts,
          confirmationStatement: profile.confirmationStatement,
          fetchedAt: checkedAt.toISOString(),
        };
      }
    } catch (err) {
      log.warn('refreshObligationState: CH API fetch failed, using DB fallback', {
        obligationId,
        companyNumber: company.companyNumber,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (!dueDate) {
    throw new Error(
      `No due date for obligation ${obligationId} (${obligation.obligationType}) — set it manually or ensure CH API key is configured`,
    );
  }

  const daysRemaining = daysUntil(dueDate);

  // ── Persist snapshot ────────────────────────────────────────────────────────
  const [snapshotRow] = await db
    .insert(externalSourceSnapshots)
    .values({ obligationId, source: 'companies_house', rawData, dueDate, resolved, checkedAt })
    .returning({ id: externalSourceSnapshots.id });

  // ── Sync obligation if dueDate or resolved changed ─────────────────────────
  if (dueDate !== obligation.dueDate) {
    await db
      .update(complianceObligations)
      .set({ dueDate, updatedAt: new Date() })
      .where(eq(complianceObligations.id, obligationId));
  }

  if (resolved && obligation.status !== 'resolved') {
    await updateObligationStatus(obligationId, 'resolved');
  }

  // ── Schedule next check ─────────────────────────────────────────────────────
  const durationMs = parseDurationToMs(toTemporalDuration(daysRemaining));
  await updateObligationNextActionAt(obligationId, new Date(checkedAt.getTime() + durationMs));

  Context.current().heartbeat({ obligationId, daysRemaining, dueDate, checkedAt });

  return {
    dueDate,
    daysRemaining,
    resolved,
    checkedAt: checkedAt.toISOString(),
    externalSnapshotId: snapshotRow?.id,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractDueDate(
  profile: {
    accounts?: { nextAccounts?: { dueOn?: string } };
    confirmationStatement?: { nextDue?: string };
  },
  obligationType: ObligationType,
): string | null {
  if (obligationType === 'accounts_filing') {
    return profile.accounts?.nextAccounts?.dueOn ?? null;
  }
  if (obligationType === 'confirmation_statement') {
    return profile.confirmationStatement?.nextDue ?? null;
  }
  return null;
}

function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)(d|h)$/);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  return match[2] === 'd' ? value * 86_400_000 : value * 3_600_000;
}
