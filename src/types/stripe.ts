import { z } from 'zod';

// ── Billing status ────────────────────────────────────────────────────────────

export type BillingStatus = 'inactive' | 'pending' | 'active' | 'past_due' | 'cancelled';

// ── Stripe checkout metadata ──────────────────────────────────────────────────

/**
 * Zod schema for Stripe checkout session metadata.
 * Validated at the webhook boundary — raw strings are never passed downstream.
 *
 * company_number: 2–8 alphanumeric chars (Companies House format)
 * alert_types: comma-separated list of obligation type slugs
 */
export const FineGuardMetadataSchema = z.object({
  company_number: z
    .string()
    .min(2)
    .max(8)
    .regex(/^[A-Z0-9]+$/i, 'company_number must be alphanumeric'),
  company_name: z.string().min(1).max(255).optional(),
  alert_types: z.string().optional(),
  tenant_id: z.string().uuid().optional(),
  fg_ref: z.string().max(100).optional(),
  source: z.literal('check_page').optional(),
});

export type FineGuardCheckoutMetadata = z.infer<typeof FineGuardMetadataSchema>;

/**
 * Parse and validate Stripe session metadata.
 * Returns null if metadata is absent or company_number fails validation.
 * Throws if metadata is present but structurally invalid (misconfigured checkout).
 */
export function parseFineGuardMetadata(
  raw: Record<string, string> | null | undefined,
): FineGuardCheckoutMetadata | null {
  if (!raw || !raw.company_number) return null;

  const result = FineGuardMetadataSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid Stripe checkout metadata: ${result.error.issues.map((i) => i.message).join(', ')}`,
    );
  }
  return result.data;
}

/**
 * Type guard — use after parseFineGuardMetadata.
 * A non-null return from parse already means company_number is valid,
 * so this is mainly a type narrowing helper.
 */
export function isValidFineGuardMetadata(
  meta: FineGuardCheckoutMetadata | null,
): meta is FineGuardCheckoutMetadata {
  return meta !== null;
}
