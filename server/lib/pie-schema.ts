import { z } from 'zod';

/**
 * PIE opportunity payload sent by Accuracy PIE to VaultLine intake.
 *
 * Contract:
 *   sourceRef = "PIE:<externalRef>"
 *   matterType = "planning" (hardcoded — all PIE opportunities are planning matters)
 *
 * externalRef is the stable upstream planning application reference (e.g. "24/AP/1234").
 * It must be unique within the PIE system and is used as the idempotency key.
 */
export const PieOpportunitySchema = z.object({
  // Upstream planning application reference — idempotency key
  externalRef: z.string().min(1).max(100),

  // Applicant details — map to intake clientName/email/phone
  applicantName: z.string().min(1).max(255),
  applicantEmail: z.string().email().optional(),
  applicantPhone: z.string().max(50).optional(),

  // Planning matter context
  description: z.string().max(2000).optional(),
  siteAddress: z.string().max(500).optional(),
  district: z.string().max(100).optional(),

  // PIE urgency scoring — maps directly to intake urgency
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),

  // Estimated claim / development value — maps to intake claimValue
  estimatedValue: z.string().max(50).optional(),

  // Timestamp of the opportunity in PIE (ISO 8601 with offset)
  submittedAt: z.string().datetime({ offset: true }).optional(),
});

export type PieOpportunity = z.infer<typeof PieOpportunitySchema>;

/** Canonical sourceRef for a PIE opportunity */
export function buildSourceRef(externalRef: string): string {
  return `PIE:${externalRef}`;
}
