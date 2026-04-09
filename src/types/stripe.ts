export type BillingStatus = 'inactive' | 'pending' | 'active' | 'past_due' | 'cancelled';

export type FineGuardCheckoutMetadata = {
  company_number: string;
  tenant_id?: string;
  source: 'check_page';
  fg_ref?: string;
  company_name?: string;
  alert_types?: string;
};

export function parseFineGuardMetadata(
  raw: Record<string, string> | null | undefined,
): FineGuardCheckoutMetadata | null {
  if (!raw?.company_number) return null;
  return {
    company_number: raw.company_number,
    tenant_id: raw.tenant_id || undefined,
    source: 'check_page',
    fg_ref: raw.fg_ref || undefined,
    company_name: raw.company_name || undefined,
    alert_types: raw.alert_types || undefined,
  };
}

export function isValidFineGuardMetadata(
  meta: ReturnType<typeof parseFineGuardMetadata>,
): meta is FineGuardCheckoutMetadata {
  return meta !== null && meta.company_number.length > 0;
}
